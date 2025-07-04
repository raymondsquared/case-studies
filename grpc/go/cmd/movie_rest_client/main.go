package main

import (
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	internalMovie "case-studies/grpc/internal/movie"
)

func main() {
	serverAddr := flag.String("server", "https://localhost:8080", "REST server address")
	minRating := flag.Float64("min_rating", 0.0, "Minimum ratings score")
	clientCert := flag.String("client_cert", "", "Path to client certificate")
	clientKey := flag.String("client_key", "", "Path to client private key")
	caCert := flag.String("ca_cert", "", "Path to CA certificate")
	flag.Parse()

	var httpClient *http.Client
	if *clientCert != "" && *clientKey != "" {
		cert, err := tls.LoadX509KeyPair(*clientCert, *clientKey)
		if err != nil {
			log.Fatalf("Failed to load client certificate/key: %v", err)
		}
		var rootCAs *x509.CertPool
		if *caCert != "" {
			caCertData, err := os.ReadFile(*caCert)
			if err != nil {
				log.Fatalf("Failed to read CA certificate: %v", err)
			}
			rootCAs = x509.NewCertPool()
			if !rootCAs.AppendCertsFromPEM(caCertData) {
				log.Fatalf("Failed to append CA certificate")
			}
		} else {
			rootCAs, err = x509.SystemCertPool()
			if err != nil {
				log.Fatalf("Failed to load system root CAs: %v", err)
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
		fmt.Fprintf(os.Stderr, "Failed to get movies: %v\n", err)
		return
	}
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		fmt.Fprintf(os.Stderr, "Server error: %s\n", string(body))
		resp.Body.Close()
		return
	}
	var moviesResp internalMovie.MovieResponse
	if err := json.NewDecoder(resp.Body).Decode(&moviesResp); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to decode response: %v\n", err)
		resp.Body.Close()
		return
	}
	resp.Body.Close()

	// No need for benchmarks, just print a success message or the movies
	fmt.Println("Successfully fetched movies.")
	// Optionally, print the movies or a subset of them
	// for _, movie := range moviesResp.Movies {
	// 	fmt.Printf("\t- %s (%.1f)\n", movie.Title, movie.Rating)
	// }
}
