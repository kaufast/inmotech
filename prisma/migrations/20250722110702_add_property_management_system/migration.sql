-- AlterTable
ALTER TABLE "user_sessions" ADD COLUMN     "browser_name" TEXT,
ADD COLUMN     "browser_version" TEXT,
ADD COLUMN     "device_name" TEXT,
ADD COLUMN     "device_type" TEXT,
ADD COLUMN     "os_name" TEXT,
ADD COLUMN     "os_version" TEXT,
ADD COLUMN     "terminated_at" TIMESTAMP(3),
ADD COLUMN     "terminated_by" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verification_expiry" TIMESTAMP(3),
ADD COLUMN     "email_verification_reminders" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_verification_email_sent" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "user_id" TEXT,
    "admin_id" TEXT,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "location" JSONB,
    "metadata" JSONB,
    "error_message" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "property_type" TEXT NOT NULL,
    "listing_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Spain',
    "postal_code" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "neighborhood" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "total_area" DOUBLE PRECISION,
    "living_area" DOUBLE PRECISION,
    "plot_size" DOUBLE PRECISION,
    "floor" INTEGER,
    "total_floors" INTEGER,
    "year_built" INTEGER,
    "sale_price" DOUBLE PRECISION,
    "rent_price" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "price_per_sqm" DOUBLE PRECISION,
    "features" JSONB,
    "amenities" JSONB,
    "condition" TEXT,
    "energy_rating" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "floor_plans" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "virtual_tour_url" TEXT,
    "owner_id" TEXT NOT NULL,
    "agent_id" TEXT,
    "is_investment_property" BOOLEAN NOT NULL DEFAULT false,
    "expected_roi" DOUBLE PRECISION,
    "rental_yield" DOUBLE PRECISION,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "published_at" TIMESTAMP(3),
    "views" INTEGER NOT NULL DEFAULT 0,
    "inquiries" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_inquiries" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "inquirer_name" TEXT NOT NULL,
    "inquirer_email" TEXT NOT NULL,
    "inquirer_phone" TEXT,
    "message" TEXT NOT NULL,
    "inquiry_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "response_message" TEXT,
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_viewings" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "viewer_name" TEXT NOT NULL,
    "viewer_email" TEXT NOT NULL,
    "viewer_phone" TEXT,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "agent_notes" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_viewings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_watchlist" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "property_watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_event_type_created_at_idx" ON "audit_logs"("event_type", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_admin_id_created_at_idx" ON "audit_logs"("admin_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_severity_created_at_idx" ON "audit_logs"("severity", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_ip_address_created_at_idx" ON "audit_logs"("ip_address", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "properties_property_type_city_idx" ON "properties"("property_type", "city");

-- CreateIndex
CREATE INDEX "properties_listing_type_status_idx" ON "properties"("listing_type", "status");

-- CreateIndex
CREATE INDEX "properties_city_property_type_listing_type_idx" ON "properties"("city", "property_type", "listing_type");

-- CreateIndex
CREATE INDEX "properties_sale_price_rent_price_idx" ON "properties"("sale_price", "rent_price");

-- CreateIndex
CREATE INDEX "properties_bedrooms_bathrooms_idx" ON "properties"("bedrooms", "bathrooms");

-- CreateIndex
CREATE INDEX "properties_is_published_status_idx" ON "properties"("is_published", "status");

-- CreateIndex
CREATE INDEX "properties_owner_id_idx" ON "properties"("owner_id");

-- CreateIndex
CREATE INDEX "properties_agent_id_idx" ON "properties"("agent_id");

-- CreateIndex
CREATE INDEX "property_inquiries_property_id_status_idx" ON "property_inquiries"("property_id", "status");

-- CreateIndex
CREATE INDEX "property_inquiries_inquirer_email_idx" ON "property_inquiries"("inquirer_email");

-- CreateIndex
CREATE INDEX "property_inquiries_created_at_idx" ON "property_inquiries"("created_at");

-- CreateIndex
CREATE INDEX "property_viewings_property_id_scheduled_date_idx" ON "property_viewings"("property_id", "scheduled_date");

-- CreateIndex
CREATE INDEX "property_viewings_viewer_email_idx" ON "property_viewings"("viewer_email");

-- CreateIndex
CREATE INDEX "property_viewings_status_idx" ON "property_viewings"("status");

-- CreateIndex
CREATE INDEX "property_watchlist_user_id_idx" ON "property_watchlist"("user_id");

-- CreateIndex
CREATE INDEX "property_watchlist_property_id_idx" ON "property_watchlist"("property_id");

-- CreateIndex
CREATE UNIQUE INDEX "property_watchlist_user_id_property_id_key" ON "property_watchlist"("user_id", "property_id");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_inquiries" ADD CONSTRAINT "property_inquiries_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_viewings" ADD CONSTRAINT "property_viewings_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_watchlist" ADD CONSTRAINT "property_watchlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_watchlist" ADD CONSTRAINT "property_watchlist_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
