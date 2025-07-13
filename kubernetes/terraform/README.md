# Getting Started

## 📁 Project Structure

```
kuberentes/
└──terraform/
   ├── __test__/                        # Unit and integration tests for Terraform CDK code
   │        
   ├── src/                             # Source code for infrastructure constructs and stacks
   │   ├── constructs/                  # Reusable infrastructure building blocks
   │   │   ├── networking/              # Networking-related constructs (e.g., VPCs, subnets)
   │   │   └── security/                # Security-related constructs (e.g., secrets management)
   │   ├── stacks/                      # Environment-specific stack definitions
   │   │   ├── base-stack.ts            # Base infrastructure stack
   │   │   ├── development-stack.ts     # Development environment stack
   │   └── utils/                       # Utility modules for common, config, tagging, and vendor logic
   │       ├── common/                  # Common utility functions and constants
   │       ├── config/                  # Configuration builders, types, and validators
   │       ├── tagging/                 # Tagging helpers and types
   │       └── vendor/                  # Vendor-specific utilities (e.g., AWS helpers)
   │   
   ├── scripts/                       # Helper scripts for setup and automation
   │        
   ├── main.ts                        # CDK application entry point
   ├── Makefile                       # Production deployment commands
   ├── package.json                   # Dependencies and scripts
   ├── package-lock.json              # Dependency lock file
   ├── cdktf.json                     # CDKTF configuration
   ├── .eslintrs.js                   # ESLint configuration
   ├── .prettierrc                    # Prettier configuration
   ├── jest.config.ts                 # Jest test configuration
   └── README.md                      # This file
```

## Technologies Used

- **Node JS 22 or higher**: Node JS programming language

## Setup & Installation

- **[Install Node JS via NVM](https://github.com/nvm-sh/nvm)**

- **Install Javascript dependencies**:
  ```bash
  make dependencies
  ```

## Usage & Code Examples

### Deploy Locally

**Example**:

```bash
make deploy
```

## Testing

```bash
make test
```
