package main

import (
	"context"
	"flag"
	"log"
	"os"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	helloWorld "google.golang.org/grpc/examples/helloworld/helloworld"
)

const (
	defaultServerURL = "0.0.0.0:50051"
	defaultName      = "world"
)

var (
	flagServerURL = flag.String("addr", defaultServerURL, "the server URL to connect to")
	flagName      = flag.String("name", defaultName, "Name to greet")
)

func getServerURL() string {
	url := *flagServerURL

	if envURL := os.Getenv("SERVER_URL"); envURL != "" {
		return envURL
	}

	return url
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
