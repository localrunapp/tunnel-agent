package middleware

import (
	"crypto/sha256"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"time"
)

const (
	CookieName = "localrun_auth"
	LoginPath  = "/localrun-login"
)

// PasswordMiddleware handles optional password protection for the tunnel
type PasswordMiddleware struct {
	password string
	next     http.Handler
}

// NewPasswordMiddleware creates a new middleware instance
func NewPasswordMiddleware(next http.Handler) *PasswordMiddleware {
	return &PasswordMiddleware{
		password: os.Getenv("TUNNEL_PASSWORD"),
		next:     next,
	}
}

func (m *PasswordMiddleware) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// If no password configured, pass through
	if m.password == "" {
		m.next.ServeHTTP(w, r)
		return
	}

	// Check for auth cookie
	cookie, err := r.Cookie(CookieName)
	if err == nil && cookie.Value == m.hashPassword() {
		// Authenticated
		m.next.ServeHTTP(w, r)
		return
	}

	// Handle login submission
	if r.Method == http.MethodPost && r.URL.Path == LoginPath {
		password := r.FormValue("password")
		if password == m.password {
			// Set cookie
			http.SetCookie(w, &http.Cookie{
				Name:     CookieName,
				Value:    m.hashPassword(),
				Path:     "/",
				Expires:  time.Now().Add(24 * time.Hour),
				HttpOnly: true,
				SameSite: http.SameSiteStrictMode,
			})

			// Redirect to original URL or root
			redirect := r.FormValue("redirect")
			if redirect == "" {
				redirect = "/"
			}
			http.Redirect(w, r, redirect, http.StatusSeeOther)
			return
		}

		// Invalid password
		m.serveLockScreen(w, r, "Invalid password")
		return
	}

	// Serve lock screen
	m.serveLockScreen(w, r, "")
}

func (m *PasswordMiddleware) hashPassword() string {
	h := sha256.New()
	h.Write([]byte(m.password))
	return fmt.Sprintf("%x", h.Sum(nil))
}

func (m *PasswordMiddleware) serveLockScreen(w http.ResponseWriter, r *http.Request, errorMsg string) {
	w.WriteHeader(http.StatusUnauthorized)

	data := struct {
		Error    string
		Redirect string
	}{
		Error:    errorMsg,
		Redirect: r.URL.String(),
	}

	tmpl, err := template.New("lockscreen").Parse(lockScreenHTML)
	if err != nil {
		log.Printf("Error parsing template: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	if err := tmpl.Execute(w, data); err != nil {
		log.Printf("Error executing template: %v", err)
	}
}

const lockScreenHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LocalRun Protected Tunnel</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0f172a;
            color: #e2e8f0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            background-color: #1e293b;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            width: 100%;
            max-width: 400px;
            text-align: center;
            border: 1px solid #334155;
        }
        h1 {
            margin-bottom: 1.5rem;
            font-size: 1.5rem;
            font-weight: 600;
        }
        input[type="password"] {
            width: 100%;
            padding: 0.75rem;
            margin-bottom: 1rem;
            border-radius: 0.5rem;
            border: 1px solid #475569;
            background-color: #0f172a;
            color: white;
            box-sizing: border-box;
            font-size: 1rem;
        }
        input[type="password"]:focus {
            outline: none;
            border-color: #3b82f6;
            ring: 2px solid #3b82f6;
        }
        button {
            width: 100%;
            padding: 0.75rem;
            background-color: #3b82f6;
            color: white;
            border: none;
            border-radius: 0.5rem;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        button:hover {
            background-color: #2563eb;
        }
        .error {
            color: #ef4444;
            margin-bottom: 1rem;
            font-size: 0.875rem;
        }
        .logo {
            margin-bottom: 1rem;
            font-size: 2rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🔒</div>
        <h1>Protected Tunnel</h1>
        {{if .Error}}
            <div class="error">{{.Error}}</div>
        {{end}}
        <form action="/localrun-login" method="POST">
            <input type="hidden" name="redirect" value="{{.Redirect}}">
            <input type="password" name="password" placeholder="Enter password" required autofocus>
            <button type="submit">Access Tunnel</button>
        </form>
    </div>
</body>
</html>
`
