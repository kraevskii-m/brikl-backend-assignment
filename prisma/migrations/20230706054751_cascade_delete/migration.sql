-- DropForeignKey
ALTER TABLE "task"."Task" DROP CONSTRAINT "Task_taskListId_fkey";

-- AddForeignKey
ALTER TABLE "task"."Task" ADD CONSTRAINT "Task_taskListId_fkey" FOREIGN KEY ("taskListId") REFERENCES "task"."TaskList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
