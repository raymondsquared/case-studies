package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	helloWorld "google.golang.org/grpc/examples/helloworld/helloworld"
)

const (
	defaultHost = "0.0.0.0"
	defaultPort = 50051
	defaultName = "world"
)

var (
	flagHost = flag.String("host", defaultHost, "the server host to connect to")
	flagPort = flag.Int("port", defaultPort, "the server port to connect to")
	flagName = flag.String("name", defaultName, "Name to greet")
)

func getServerURL() string {
	host := *flagHost
	port := *flagPort

	if envHost := os.Getenv("SERVER_HOST"); envHost != "" {
		host = envHost
	}

	if envPortStr := os.Getenv("SERVER_PORT"); envPortStr != "" {
		if p, err := strconv.Atoi(envPortStr); err == nil {
			port = p
		}
	}

	return fmt.Sprintf("%s:%d", host, port)
}

func getName() string {
	name := *flagName

	if envName := os.Getenv("NAME"); envName != "" {
		return envName
	}

	return name
}

func main() {
	flag.Parse()

	serverURL := getServerURL()
	name := getName()

	conn, err := grpc.NewClient(serverURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("did not connect: %v", err)
	}
	defer conn.Close()

	client := helloWorld.NewGreeterClient(conn)
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	r, err := client.SayHello(ctx, &helloWorld.HelloRequest{Name: name})
	if err != nil {
		log.Fatalf("could not greet: %v", err)
	}
	log.Printf("Greeting: %s", r.GetMessage())
}
