#!/bin/bash

# Environment setup and validation script
REQUIRED_VARS=(
    "TELEGRAM_BOT_TOKEN_ETHMemeLord9000"
    "TELEGRAM_BOT_TOKEN_BagFlipper9000"
    "TELEGRAM_BOT_TOKEN_LindAEvangelista88"
    "TELEGRAM_BOT_TOKEN_VCShark99"
    "TELEGRAM_BOT_TOKEN_BitcoinMaxi420"
    "TELEGRAM_BOT_TOKEN_CodeSamurai77"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to validate environment variables
validate_env() {
    local missing_vars=()
    
    echo "🔍 Validating environment variables..."
    
    # First source the .env file
    if [ -f .env ]; then
        set -a
        source .env
        set +a
        echo "✅ Sourced .env file"
    else
        echo "${RED}❌ No .env file found${NC}"
        return 1
    fi
    
    # Check for required variables
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    # Report status
    if [ ${#missing_vars[@]} -eq 0 ]; then
        echo "${GREEN}✅ All required variables are set${NC}"
        return 0
    else
        echo "${RED}❌ Missing required variables:${NC}"
        for var in "${missing_vars[@]}"; do
            echo "   - $var"
        done
        return 1
    fi
}

# Function to backup working environment
backup_env() {
    echo "📦 Backing up environment variables..."
    
    # Create backup directory if it doesn't exist
    mkdir -p .env_backups
    
    # Create backup with timestamp
    backup_file=".env_backups/.env.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Only backup variables we care about
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -n "${!var}" ]; then
            echo "$var=${!var}" >> "$backup_file"
        fi
    done
    
    echo "✅ Environment backed up to $backup_file"
}

# Function to restore from latest backup if current env is broken
restore_latest_backup() {
    echo "🔄 Attempting to restore from backup..."
    
    latest_backup=$(ls -t .env_backups/.env.backup.* 2>/dev/null | head -n1)
    
    if [ -n "$latest_backup" ]; then
        set -a
        source "$latest_backup"
        set +a
        echo "${GREEN}✅ Restored from $latest_backup${NC}"
        return 0
    else
        echo "${RED}❌ No backup found${NC}"
        return 1
    fi
}

# Function to export variables for a specific agent
export_agent_vars() {
    local character=$1
    local env_character
    
    # Convert character name to match environment variable case
    case "$character" in
        "eth_memelord_9000") env_character="ETHMemeLord9000" ;;
        "bag_flipper_9000") env_character="BagFlipper9000" ;;
        "linda_evangelista_88") env_character="LindAEvangelista88" ;;
        "vc_shark_99") env_character="VCShark99" ;;
        "bitcoin_maxi_420") env_character="BitcoinMaxi420" ;;
        "code_samurai_77") env_character="CodeSamurai77" ;;
        *) env_character="$character" ;;
    esac
    
    local token_var="TELEGRAM_BOT_TOKEN_${env_character}"
    local token_value="${!token_var}"
    
    if [ -n "$token_value" ]; then
        export TELEGRAM_BOT_TOKEN="$token_value"
        # Export additional runtime variables
        export AGENT_ID="$character"
        export USE_IN_MEMORY_DB=true
        export RELAY_SERVER_URL="http://localhost:4000"
        export RELAY_AUTH_TOKEN="elizaos-secure-relay-key"
        export TELEGRAM_GROUP_IDS="-1002550618173"
        export FORCE_EXACT_PORT=true
        export DISABLE_POLLING=false
        export FORCE_GC=true
        
        echo "${GREEN}✅ Exported TELEGRAM_BOT_TOKEN and runtime variables for $character${NC}"
        return 0
    else
        echo "${RED}❌ Failed to export token for $character${NC}"
        return 1
    fi
}

# Main execution
main() {
    local action=$1
    local character=$2
    
    case "$action" in
        "validate")
            validate_env
            ;;
        "backup")
            validate_env && backup_env
            ;;
        "restore")
            restore_latest_backup && validate_env
            ;;
        "export")
            if [ -z "$character" ]; then
                echo "${RED}❌ Character name required for export${NC}"
                return 1
            fi
            echo "${YELLOW}ℹ️ Note: This script must be run once per agent terminal, before patches or agent launch.${NC}"
            validate_env && export_agent_vars "$character"
            ;;
        *)
            echo "Usage: $0 [validate|backup|restore|export <character_name>]"
            echo "Examples:"
            echo "  $0 validate                    # Validate environment"
            echo "  $0 backup                      # Backup working environment"
            echo "  $0 restore                     # Restore from latest backup"
            echo "  $0 export eth_memelord_9000    # Export variables for specific agent"
            return 1
            ;;
    esac
}

# Allow script to be sourced without running main
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 