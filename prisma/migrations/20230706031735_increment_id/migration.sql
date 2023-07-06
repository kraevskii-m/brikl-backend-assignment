-- AlterTable
CREATE SEQUENCE "task".task_id_seq;
ALTER TABLE "task"."Task" ALTER COLUMN "id" SET DEFAULT nextval('"task".task_id_seq');
ALTER SEQUENCE "task".task_id_seq OWNED BY "task"."Task"."id";

-- AlterTable
CREATE SEQUENCE "task".tasklist_id_seq;
ALTER TABLE "task"."TaskList" ALTER COLUMN "id" SET DEFAULT nextval('"task".tasklist_id_seq');
ALTER SEQUENCE "task".tasklist_id_seq OWNED BY "task"."TaskList"."id";
