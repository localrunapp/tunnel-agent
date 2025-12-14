package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/exec"
	"os/signal"
	"syscall"
	"time"

	"github.com/localrunapp/tunnel-agent/internal/metrics"
	"github.com/localrunapp/tunnel-agent/internal/middleware"
)

func main() {
	// Parse flags
	provider := flag.String("provider", os.Getenv("PROVIDER"), "Tunnel provider (ngrok, cloudflare, pinggy)")
	port := flag.String("port", os.Getenv("TUNNEL_PORT"), "Local port to proxy")
	tunnelID := flag.String("tunnel-id", os.Getenv("TUNNEL_ID"), "Tunnel ID")
	backendURL := flag.String("backend-url", getEnv("BACKEND_URL", ""), "Backend URL")
	interval := flag.Int("interval", 10, "Metrics interval in seconds")
	ngrokArgs := flag.String("ngrok-args", "", "Additional ngrok arguments")

	flag.Parse()

	if *provider == "" || *port == "" {
		log.Fatal("provider and port are required")
	}

	if *tunnelID == "" {
		*tunnelID = fmt.Sprintf("%s-%s", *provider, *port)
	}

	log.Printf("Starting LocalRun Agent (Go)")
	log.Printf("Provider: %s", *provider)
	log.Printf("Port: %s", *port)
	log.Printf("Tunnel ID: %s", *tunnelID)

	// Start tunnel daemon as subprocess
	tunnelCmd := startTunnelDaemon(*provider, *port, *ngrokArgs)
	defer tunnelCmd.Process.Kill()

	// Start metrics collector
	collector := metrics.NewCollector(*provider, *tunnelID, *port, *backendURL)
	go collector.Start(time.Duration(*interval) * time.Second)

	// Setup reverse proxy
	targetHost := getEnv("TARGET_HOST", "localhost")
	target, err := url.Parse(fmt.Sprintf("http://%s:%s", targetHost, *port))
	if err != nil {
		log.Fatal(err)
	}

	proxy := httputil.NewSingleHostReverseProxy(target)
	metricsHandler := collector.MetricsMiddleware(proxy)
	handler := middleware.NewPasswordMiddleware(metricsHandler)

	// Start proxy server
	proxyPort := "8080"
	go func() {
		log.Printf("Proxy listening on :%s -> %s", proxyPort, target.String())
		if err := http.ListenAndServe(":"+proxyPort, handler); err != nil {
			log.Fatal(err)
		}
	}()

	// Wait for shutdown signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	log.Println("Shutting down...")
}

func startTunnelDaemon(provider, port, extraArgs string) *exec.Cmd {
	var cmd *exec.Cmd

	// Tunnel should point to our local proxy, not the target directly
	// The proxy (running on 8080) handles the password check and forwards to target
	targetURL := "http://localhost:8080"

	switch provider {
	case "ngrok":
		// ngrok v3 reads NGROK_AUTHTOKEN from environment automatically
		// We don't need to pass --authtoken flag if the env var is set
		args := []string{"http", targetURL}

		// If user passed extra args (like --domain), append them
		if extraArgs != "" {
			// Simple split, for more complex args we might need a parser
			// but for now this suffices for basic flags
			args = append(args, extraArgs)
		}

		cmd = exec.Command("ngrok", args...)

	case "cloudflare", "cloudflared":
		tunnelToken := os.Getenv("CLOUDFLARE_TUNNEL_TOKEN")
		if tunnelToken != "" {
			// Private tunnel
			cmd = exec.Command("cloudflared", "tunnel", "run", "--token", tunnelToken)
		} else {
			// Quick tunnel
			cmd = exec.Command("cloudflared", "tunnel", "--url", targetURL)
		}

	case "pinggy":
		// Pinggy uses SSH
		// We use localhost:8080 (our proxy) as the target
		// -q: Quiet mode (suppress warning/welcome messages)
		// -T: Disable pseudo-tty allocation (suppress interactive elements like QR codes)
		args := []string{"-p", "443", "-q", "-T", "-R0:localhost:8080", "-o", "StrictHostKeyChecking=no", "-o", "ServerAliveInterval=30", "a.pinggy.io"}

		// If token is provided (for persistent URLs)
		token := os.Getenv("PINGGY_TOKEN")
		if token != "" {
			args[len(args)-1] = fmt.Sprintf("%s@a.pinggy.io", token)
		}

		cmd = exec.Command("ssh", args...)

	default:
		log.Fatalf("Unknown provider: %s", provider)
	}

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		log.Fatalf("Failed to start %s: %v", provider, err)
	}

	log.Printf("%s tunnel started (PID: %d)", provider, cmd.Process.Pid)

	// For ngrok, we need to query the local API to get the public URL
	if provider == "ngrok" {
		go func() {
			// Wait for ngrok to start
			time.Sleep(2 * time.Second)

			// Retry a few times
			for i := 0; i < 10; i++ {
				resp, err := http.Get("http://localhost:4040/api/tunnels")
				if err == nil {
					defer resp.Body.Close()
					var result struct {
						Tunnels []struct {
							PublicURL string `json:"public_url"`
						} `json:"tunnels"`
					}
					if err := json.NewDecoder(resp.Body).Decode(&result); err == nil && len(result.Tunnels) > 0 {
						log.Printf("🚇 Ngrok Public URL: %s", result.Tunnels[0].PublicURL)
						return
					}
				}
				time.Sleep(1 * time.Second)
			}
			log.Printf("⚠️ Could not retrieve ngrok URL from local API")
		}()
	}

	return cmd
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
