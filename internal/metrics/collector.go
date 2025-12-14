package metrics

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"runtime"
	"sync/atomic"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/mem"
)

type Collector struct {
	provider   string
	tunnelID   string
	port       string
	backendURL string
	
	// Metrics counters
	requestCount  atomic.Uint64
	bytesIn       atomic.Uint64
	bytesOut      atomic.Uint64
	errorCount    atomic.Uint64
	startTime     time.Time
}

type Metrics struct {
	Provider  string                 `json:"provider"`
	TunnelID  string                 `json:"tunnel_id"`
	TunnelPort string                `json:"tunnel_port"`
	Timestamp float64                `json:"timestamp"`
	Metrics   map[string]interface{} `json:"metrics"`
}

func NewCollector(provider, tunnelID, port, backendURL string) *Collector {
	return &Collector{
		provider:   provider,
		tunnelID:   tunnelID,
		port:       port,
		backendURL: backendURL,
		startTime:  time.Now(),
	}
}

func (c *Collector) MetricsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Track request
		c.requestCount.Add(1)
		c.bytesIn.Add(uint64(r.ContentLength))

		// Wrap response writer to capture bytes out
		wrapped := &responseWriter{ResponseWriter: w, collector: c}
		
		next.ServeHTTP(wrapped, r)
	})
}

type responseWriter struct {
	http.ResponseWriter
	collector *Collector
	written   int
}

func (w *responseWriter) Write(b []byte) (int, error) {
	n, err := w.ResponseWriter.Write(b)
	w.written += n
	w.collector.bytesOut.Add(uint64(n))
	return n, err
}

func (c *Collector) Start(interval time.Duration) {
	if c.backendURL == "" {
		log.Println("No backend URL provided, metrics collection disabled")
		return
	}
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for range ticker.C {
		if err := c.sendMetrics(); err != nil {
			log.Printf("Error sending metrics: %v", err)
		}
	}
}

func (c *Collector) sendMetrics() error {
	// Collect system metrics
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)
	
	cpuPercent, _ := cpu.Percent(0, false)
	vmem, _ := mem.VirtualMemory()

	uptime := time.Since(c.startTime).Seconds()
	
	metrics := Metrics{
		Provider:   c.provider,
		TunnelID:   c.tunnelID,
		TunnelPort: c.port,
		Timestamp:  float64(time.Now().Unix()) + float64(time.Now().Nanosecond())/1e9,
		Metrics: map[string]interface{}{
			"tunnel": map[string]interface{}{
				"status":         "running",
				"uptime_seconds": uptime,
			},
			"requests": map[string]interface{}{
				"total":  c.requestCount.Load(),
				"errors": c.errorCount.Load(),
			},
			"bandwidth": map[string]interface{}{
				"bytes_in":  c.bytesIn.Load(),
				"bytes_out": c.bytesOut.Load(),
			},
			"container": map[string]interface{}{
				"memory_usage_bytes": memStats.Alloc,
				"memory_percent":     vmem.UsedPercent,
				"cpu_percent":        cpuPercent[0],
			},
		},
	}

	// Send to backend
	jsonData, err := json.Marshal(metrics)
	if err != nil {
		return err
	}

	resp, err := http.Post(
		fmt.Sprintf("%s/api/metrics/ingest", c.backendURL),
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("unexpected status: %d", resp.StatusCode)
	}

	log.Printf("Metrics sent: %d requests, %d bytes in, %d bytes out",
		c.requestCount.Load(), c.bytesIn.Load(), c.bytesOut.Load())

	return nil
}
