## API Reference

#### Hello World

The project implements a simple Hello World gRPC service:

```protobuf
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply) {}
}
```

```protobuf
message HelloRequest {
  string name = 1;
}

message HelloReply {
  string message = 1;
}
```

---

#### Movie

```protobuf
service Getter {
  rpc GetMoviesByRatings (GetMovieInput) returns (GetMovieOutput) {}

  rpc GetMoviesByRatingsStream (stream GetMovieInput) returns (stream GetMovieOutput) {}
}
```

```protobuf
message GetMovieInput {
  float minimum_ratings_score = 1;
}

message GetMovieOutput {
  repeated Movie movie = 1;
  int32 movie_count = 2;
  int32 movie_count_so_far = 3;
}

message Movie {
  string movie_id = 1;
  string title = 2;
  string release_date = 3;
  repeated string genre = 4;
  Director director = 5;
  repeated Producer producer = 6;
  repeated CastMember cast = 7;
  repeated CrewMember crew = 8;
  string plot_summary = 9;
  float ratings_score = 10;
}

message Director {
  string name = 1;
}

message Producer {
  string name = 1;
}

message CastMember {
  string actor_name = 1;
  string character_name = 2;
  string role = 3;
  string biography = 4;
}

message CrewMember {
  string name = 1;
  string role = 2;
}
```