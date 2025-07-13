# Case Studies

[![gRPC Go - CD](https://github.com/raymondsquared/case-studies/actions/workflows/grpc-go-cd.yaml/badge.svg)](https://github.com/raymondsquared/case-studies/actions/workflows/grpc-go-cd.yaml)

[![Kubernetes Terraform - CD](https://github.com/raymondsquared/case-studies/actions/workflows/kubernetes-terraform-cd.yaml/badge.svg)](https://github.com/raymondsquared/case-studies/actions/workflows/kubernetes-terraform-cd.yaml)


## Overview

This repository showcases a curated collection of unique case studies from past projects. Each case highlights a complex challenge, the strategic approach taken, and the measurable outcomes achieved. The goal is to illustrate problem-solving capabilities, technical depth, and alignment with business objectives.

## Features

- Real-world scenarios.
- Clear articulation of the problem, approach, and solution.
- Structured documentation with insights, visuals, and metrics.
- Covers a range of domains including systems architecture, product delivery, and operational efficiency.

## Getting Started

### Case Studies

| Case Study    | Status                                                                                                                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [gRPC](grpc/) | [![gRPC Go - CI](https://github.com/raymondsquared/case-studies/actions/workflows/grpc-go-ci.yaml/badge.svg)](https://github.com/raymondsquared/case-studies/actions/workflows/grpc-go-ci.yaml) |
| [Kubernetes](kubernetes/) | [![Kubernetes Terraform - CI](https://github.com/raymondsquared/case-studies/actions/workflows/kubernetes-terraform-ci.yaml/badge.svg)](https://github.com/raymondsquared/case-studies/actions/workflows/kubernetes-terraform-ci.yaml) |

---

### Project Structure

```
case-studies/
├── .github/                        # GitHub Action
│   └── workflows/                  # Workflows directory for GitHub Action
│
├── grpc/                           # Case study #1 - gRPC
│   └── go/                         # Programming language or framework
│       └── README.md
│
├── kubernetes/                     # Case study #2 - Kubernetes
│   └── terraform/                  # Programming language or framework
│       └── README.md
│
├── scripts/                        # Utility Scripts
│
└── README.md                       # Main documentation
```

## Technologies Used

- Makefile
- Docker
- Kubernetes

## Setup & Installation

To clone locally:

```bash
git clone https://github.com/raymondsquared/case-studies.git

cd case-studies/xxx
make run-xxx
```

## Usage & Code Examples

- Development Commands: All available Makefile commands organised by category

Example:

```bash
  make xxx-yyy
```

## Testing

```bash
  make test
```

## Status & Roadmap

| Items                                                      | Status      | Version |
| ---------------------------------------------------------- | ----------- | ------- |
| [gRPC](grpc/)                                              | COMPLETED   | 0.0.2   |
| REST API                                                   | TO DO       |         |
| GraphQL API                                                | TO DO       |         |
| Domain Driven Design                                       | TO DO       |         |
| Concurrency vs Parallelism                                 | TO DO       |         |
| Actor Based                                                | TO DO       |         |
| Design Pattern                                             | TO DO       |         |
| [Kubernetes](kubernetes/)                                  | IN PROGRESS | 0.0.3   |
| Integration                                                | TO DO       |         |
| Kafka                                                      | TO DO       |         |
| Data Platform                                              | TO DO       |         |
| AI                                                         | TO DO       |         |
| Compliance (GDPR, HIPPA ISO27001, PCI DSS, NIST,and SOC 2) | TO DO       |         |

## Inspiration

- [3musketeers](https://3musketeers.io/)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
- [Grafana K6](https://k6.io/)

## Contact

Repository by [Raymond](https://github.com/raymondsquared).  
For questions, feedback, or collaboration opportunities, feel free to reach out via GitHub or LinkedIn.
