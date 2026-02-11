-- Trigger to update total_lessons in courses table
CREATE OR REPLACE FUNCTION update_course_lesson_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE courses
    SET total_lessons = total_lessons + 1
    WHERE id = NEW.course_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE courses
    SET total_lessons = total_lessons - 1
    WHERE id = OLD.course_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_course_lesson_count_trigger ON lessons;

CREATE TRIGGER update_course_lesson_count_trigger
AFTER INSERT OR DELETE ON lessons
FOR EACH ROW
EXECUTE FUNCTION update_course_lesson_count();

-- Recaculate counts for existing courses (Correction script)
UPDATE courses c
SET total_lessons = (
  SELECT count(*)
  FROM lessons l
  WHERE l.course_id = c.id
);
