package main

import (
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"

	internalMovie "case-studies/grpc/internal/movie"
	"case-studies/grpc/internal/observability"
)

const (
	AppType = "rest-client"
	AppName = "movie"
)

func main() {
	serverAddr := flag.String("server", "https://localhost:8080", "REST server address")
	minRating := flag.Float64("min_rating", 0.0, "Minimum ratings score")
	clientCert := flag.String("client_cert", "", "Path to client certificate")
	clientKey := flag.String("client_key", "", "Path to client private key")
	caCert := flag.String("ca_cert", "", "Path to CA certificate")
	flag.Parse()

	observability.SetupLogger("info")
	observability.LogStartup(AppType, AppName, map[string]interface{}{
		"server":     *serverAddr,
		"min_rating": *minRating,
	})

	var httpClient *http.Client
	if *clientCert != "" && *clientKey != "" {
		cert, err := tls.LoadX509KeyPair(*clientCert, *clientKey)
		if err != nil {
			observability.LogError("tls-load", "main", err, map[string]interface{}{
				"cert_file": *clientCert,
				"key_file":  *clientKey,
			})
			os.Exit(1)
		}
		var rootCAs *x509.CertPool
		if *caCert != "" {
			caCertData, err := os.ReadFile(*caCert)
			if err != nil {
				observability.LogError("ca-cert-read", "main", err, map[string]interface{}{
					"ca_cert": *caCert,
				})
				os.Exit(1)
			}
			rootCAs = x509.NewCertPool()
			if !rootCAs.AppendCertsFromPEM(caCertData) {
				observability.LogError("ca-cert-append", "main", fmt.Errorf("failed to append CA certificate"), nil)
				os.Exit(1)
			}
		} else {
			rootCAs, err = x509.SystemCertPool()
			if err != nil {
				observability.LogError("system-ca-load", "main", err, nil)
				os.Exit(1)
			}
		}
		tlsConfig := &tls.Config{
			Certificates: []tls.Certificate{cert},
			RootCAs:      rootCAs,
			MinVersion:   tls.VersionTLS12,
		}
		transport := &http.Transport{TLSClientConfig: tlsConfig}
		httpClient = &http.Client{Transport: transport}
	} else {
		httpClient = http.DefaultClient
	}

	url := fmt.Sprintf("%s/movies?min_rating=%f", *serverAddr, *minRating)

	resp, err := httpClient.Get(url)
	if err != nil {
		observability.LogError("http-request", "main", err, map[string]interface{}{
			"url": url,
		})
		os.Exit(1)
	}
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		observability.LogError("http-response", "main", fmt.Errorf("server returned error status"), map[string]interface{}{
			"status_code": resp.StatusCode,
			"body":        string(body),
		})
		resp.Body.Close()
		os.Exit(1)
	}
	var moviesResp internalMovie.MovieResponse
	if err := json.NewDecoder(resp.Body).Decode(&moviesResp); err != nil {
		observability.LogError("json-decode", "main", err, nil)
		resp.Body.Close()
		os.Exit(1)
	}
	resp.Body.Close()

	observability.LogSuccess("movies-fetch", "main", map[string]interface{}{
		"movie_count": moviesResp.MovieCount,
		"url":         url,
	})
}
