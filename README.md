# FieldForce Pro - FSM Platform

A multi-tenant B2B SaaS Field Service Management 
platform built with NestJS, React, PostgreSQL and Redis.

## View [changelogs & documentation](docs/) 👈

## Prerequisites
- Docker Desktop installed
- Git installed

## Quick Start

### 1. Clone the repository
git clone https://github.com/h0niin/FieldForce-Pro.git
cd FieldForce-Pro

### 2. Copy environment files
cp .env.example .env

### 3. Start all services
docker-compose up --build

### 4. Access the application
- Frontend: http://localhost:3123
- Backend API: http://localhost:3213

## Default Super Admin
- Email: fsm.superadmin@fieldforce.com
- Password: FieldForce@Super#2024

## Architecture
- Frontend: React + Vite served via nginx
- Backend: NestJS REST API
- Database: PostgreSQL
- Cache: Redis
- Auth: JWT + Magic Links

## Multi-Tenant Architecture
Each company that subscribes gets their own 
completely isolated workspace with:
- Separate data per tenant
- Role-based access control
- Custom roles and permissions
- API key integration for their website

## User Roles
- Super Admin: Platform owner
- Company Admin: Manages their company
- Manager: Oversees operations
- Dispatcher: Assigns technicians
- Technician: Handles field jobs
