-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "task";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "user";

-- CreateEnum
CREATE TYPE "task"."TaskStatus" AS ENUM ('CREATED', 'COMLETED');

-- CreateTable
CREATE TABLE "user"."User" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task"."Task" (
    "id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "status" "task"."TaskStatus" NOT NULL DEFAULT 'CREATED',
    "order" DOUBLE PRECISION NOT NULL,
    "taskListId" INTEGER NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task"."TaskList" (
    "id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,

    CONSTRAINT "TaskList_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "task"."Task" ADD CONSTRAINT "Task_taskListId_fkey" FOREIGN KEY ("taskListId") REFERENCES "task"."TaskList"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
