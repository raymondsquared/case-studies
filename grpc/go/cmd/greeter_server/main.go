package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net"
	"os"
	"strconv"

	helloworldLocal "case-studies/grpc/cmd/helloworld"

	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	grpc_health_v1 "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/reflection"
)

const (
	defaultPort = 50051
)

var (
	flagPort = flag.Int("port", defaultPort, "The server port")
)

// server is used to implement helloworldLocal.GreeterServer.
type server struct {
	helloworldLocal.UnimplementedGreeterServer
}

// SayHello implements helloworldLocal.GreeterServer
func (s *server) SayHello(_ context.Context, in *helloworldLocal.HelloRequest) (*helloworldLocal.HelloReply, error) {
	log.Printf("Received: %v", in.GetName())
	return &helloworldLocal.HelloReply{Message: "Hello " + in.GetName()}, nil
}

func getPort() int {
	port := *flagPort

	if envPortStr := os.Getenv("SERVER_PORT"); envPortStr != "" {
		if p, err := strconv.Atoi(envPortStr); err == nil {
			return p
		}
	}

	return port
}

func main() {
	flag.Parse()
	port := getPort() // No need to pass defaultPort, as flagPort already handles it

	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", port))
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	helloWorldServer := grpc.NewServer()
	helloworldLocal.RegisterGreeterServer(helloWorldServer, &server{})

	healthServer := health.NewServer()
	grpc_health_v1.RegisterHealthServer(helloWorldServer, healthServer)

	reflection.Register(helloWorldServer)

	log.Printf("server listening at %v", lis.Addr())
	if err := helloWorldServer.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
