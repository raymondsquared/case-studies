# Kubernetes Case Studies

> **TL;DR**
>
> TBD

---

## Overview

This repository showcases the power of Kubernetes, powerful open-source platform that automates the deployment, scaling, and management of containerized applications, as demonstrated by the practical examples in this repository. It provides a robust and resilient environment for distributed systems, streamlining operations through declarative configuration and automation combined with best-of-breed ideas and practices from the community.

### Project Structure

```
kubernetes/
└── terraform/                  # Main framework
    └── README.md
```

## Features

- **Service discovery and load balancing**: TBD.

- **Storage orchestration**: TBD

- **Automated rollouts and rollbacks**: TBD.

- **Automatic bin packing**: TBD.

- **Self-healing**: TBD.

- **Secret and configuration management**: TBD.

- **Batch execution**: TBD.

- **Horizontal scaling**: TBD.

- **IPv4/IPv6 dual-stack**: TBD.

- **Designed for extensibility**: TBD.

## Drawbacks

- Complexity

- Resource Overhead

- Operation Overhead

- Cost

## TO DO List

| Category                    | Item                                             | Detail |
|-----------------------------|--------------------------------------------------|--------|
| Security & Compliance       | Deeper security enhancements                     | Network policies, RBAC hardening, OIDC provider, service account restrictions, resource quotas, CIS benchmarks, security scanning |
| Security & Compliance       | Private endpoint enforcement for API server      | Enforce for prod |
| Security & Compliance       | Resource limits/quotas for namespaces            | Explicitly enforced |
| Security & Compliance       | Audit and rotation of credentials                | For SSO/IAM users |
| Security & Compliance       | Service account creation for add-ons/workloads   | For workloads needing AWS permissions |
| Security & Compliance       | Pod Identity                                     | IAM roles for service accounts, enablePodIdentity, EKS Pod Identity add-on |
| Security & Compliance       | Secrets Manager integration                      | For workloads |
| Security & Compliance       | KMS key management for secrets encryption        | Provision, rotation, policy hardening |
| Security & Compliance       | Cost controls                                    | Spot instances, quotas, autoscaler policies |
| Add-ons & Configuration     | AWS Load Balancer Controller                     | enableAlbIngress or 'aws-load-balancer-controller' |
| Add-ons & Configuration     | ExternalDNS                                      | enableExternalDns or 'external-dns' |
| Add-ons & Configuration     | EBS CSI Driver                                   | enableEbsCsi or 'ebs-csi-driver' |
| Add-ons & Configuration     | EFS CSI Driver                                   | enableEfsCsi or 'efs-csi-driver' |
| Add-ons & Configuration     | CoreDNS Autoscaler                               | enableCoreDnsAutoscaler or 'coredns-autoscaler' |
| Add-ons & Configuration     | Metrics Server                                   | enableMetricsServer or 'metrics-server' |
| Add-ons & Configuration     | Calico Network Policy                            | enableCalicoNetworkPolicy or 'calico' |
| Add-ons & Configuration     | Pod Identity Add-on                              | enablePodIdentity or 'eks-pod-identity-agent' |
| Add-ons & Configuration     | Karpenter                                      | Cluster autoscaler for dynamic node provisioning |
| Observability & Monitoring  | Container Insights                               | CloudWatch agent/Fluent Bit DaemonSets, not an EKS add-on |
| Observability & Monitoring  | Set up log retention in CloudWatch               | For control plane logs (manual step) |
| Observability & Monitoring  | Metrics Server                                   | For resource metrics, HPA, etc. |
| Observability & Monitoring  | CoreDNS Autoscaler                               | For scaling CoreDNS pods based on cluster size |
| Observability & Monitoring  | Enhanced logging/monitoring                      | Fluent Bit, CloudWatch agent, Prometheus, Grafana, X-Ray/OpenTelemetry |
| Backup, Restore & DR        | Backup/restore automation                        | Velero or AWS Backup and restore procedures |
| Backup, Restore & DR        | Disaster Recovery automation                     | Cross-region backup/restore |
| Networking                  | Ingress/Egress controls                          | NACLs, security groups, network policies for egress |


## Screenshots

- TBD

## Inspiration

- [3musketeers](https://3musketeers.io/)
- [Kubernetes](https://kubernetes.io/)
- [Terraform](https://developer.hashicorp.com/terraform/)
- [NestJS](https://awesome-nestjs.com/resources/examples.html)
- [NodeJS](https://nodejs.org/en)
- [NVM](https://github.com/nvm-sh/nvm)


## Contact

Repository by [Raymond](https://github.com/raymondsquared).  
For questions, feedback, or collaboration opportunities, feel free to reach out via GitHub or LinkedIn.
