# InmoTech User Management Scripts

## 🚀 Quick Start

### 1. Setup Database (First Time Only)
```bash
# Create database tables
npm run db:migrate

# Setup default roles
npm run add-user -- --setup-roles
```

### 2. Add New Users
```bash
# Add admin user
npm run add-user -- admin@inmotech.com password123 John Doe admin

# Add regular investor
npm run add-user -- investor@example.com pass123 Jane Smith investor

# Add property manager
npm run add-user -- pm@inmotech.com pass123 Mike Johnson property_manager
```

### 3. Change User Roles
```bash
# Replace user's role completely
npm run change-role -- investor@example.com admin

# Add additional role to user
npm run change-role -- --add user@example.com property_manager

# Remove specific role from user
npm run change-role -- --remove user@example.com investor
```

### 4. View Information
```bash
# List all users
npm run add-user -- --list

# Show user's roles
npm run change-role -- --show user@example.com

# List available roles
npm run change-role -- --list-roles
```

## 📋 Available Roles

| Role | Description | Admin Access |
|------|-------------|--------------|
| `admin` | System administrator with full access | ✅ Yes |
| `investor` | Regular investor user | ❌ No |
| `property_manager` | Property management role | ❌ No |
| `analyst` | Financial analyst role | ❌ No |
| `support` | Customer support role | ❌ No |

## 🔧 Script Commands

### Add User Script (`npm run add-user`)

**Syntax:**
```bash
npm run add-user <email> <password> <firstName> <lastName> [role]
```

**Options:**
- `--list` - List all users
- `--setup-roles` - Create default roles
- `--help` - Show help

**Examples:**
```bash
# Create admin user
npm run add-user admin@inmotech.com secret123 Admin User admin

# Create investor (default role)
npm run add-user john@example.com pass123 John Smith

# List all users
npm run add-user --list
```

### Change Role Script (`npm run change-role`)

**Syntax:**
```bash
npm run change-role <email> <newRole>
npm run change-role --add <email> <role>
npm run change-role --remove <email> <role>
npm run change-role --show <email>
```

**Options:**
- `--add` - Add role to user (keeps existing roles)
- `--remove` - Remove specific role from user
- `--show` - Show user's current roles
- `--list-roles` - List all available roles
- `--help` - Show help

**Examples:**
```bash
# Change user to admin
npm run change-role user@example.com admin

# Add property manager role
npm run change-role --add user@example.com property_manager

# Remove investor role
npm run change-role --remove user@example.com investor

# Show user's roles
npm run change-role --show user@example.com
```

## 🛡️ Security Features

- **Password Hashing**: All passwords are hashed with bcrypt (12 rounds)
- **Email Validation**: Validates email format before creating users
- **Password Requirements**: Minimum 6 characters
- **Role Validation**: Ensures roles exist before assignment
- **Duplicate Prevention**: Prevents duplicate users with same email

## 📝 Common Workflows

### 1. Initial Setup
```bash
# 1. Setup default roles
npm run add-user --setup-roles

# 2. Create admin user
npm run add-user admin@inmotech.com admin123 Admin User admin

# 3. Create test investor
npm run add-user test@example.com test123 Test User investor
```

### 2. User Management
```bash
# Promote user to admin
npm run change-role user@example.com admin

# Demote admin to investor
npm run change-role admin@example.com investor

# Give user multiple roles
npm run change-role --add user@example.com property_manager
npm run change-role --add user@example.com analyst
```

### 3. Audit Users
```bash
# List all users and their roles
npm run add-user --list

# Check specific user
npm run change-role --show user@example.com

# List available roles
npm run change-role --list-roles
```

## 🚨 Error Handling

The scripts handle common errors:
- ✅ Duplicate email detection
- ✅ Invalid email format validation
- ✅ Password length requirements
- ✅ Non-existent user/role handling
- ✅ Database connection issues

## 💡 Tips

1. **Always verify roles exist**: Run `npm run change-role --list-roles` to see available roles
2. **Check user status**: Use `npm run change-role --show <email>` before making changes
3. **Backup before bulk changes**: Consider database backup for production
4. **Use strong passwords**: Especially for admin accounts
5. **Test with non-admin users**: Ensure role permissions work correctly

## 🔗 Related

- See `RBAC_GUIDE.md` for role-based access control information
- Check `src/lib/rbac.ts` for permission management
- Review `prisma/schema.prisma` for database schema