import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const toggleLessonCompletion = async (req: Request, res: Response) => {
    try {
        const { lessonId, courseId, completed, userId } = req.body;

        if (!lessonId || !courseId || !userId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (completed) {
            // Mark as completed
            const { data, error } = await supabase
                .from('lesson_progress')
                .upsert({
                    user_id: userId,
                    lesson_id: lessonId,
                    course_id: courseId,
                    completed_at: new Date().toISOString()
                }, { onConflict: 'user_id, lesson_id' })
                .select()
                .single();

            if (error) throw error;
            return res.json({ success: true, data });
        } else {
            // Mark as incomplete (remove progress)
            const { error } = await supabase
                .from('lesson_progress')
                .delete()
                .match({ user_id: userId, lesson_id: lessonId });

            if (error) throw error;
            return res.json({ success: true, message: 'Progress removed' });
        }

    } catch (error: any) {
        console.error('Error toggling progress:', error);
        return res.status(500).json({ error: 'Failed to update progress' });
    }
};

export const getCourseProgress = async (req: Request, res: Response) => {
    try {
        const { courseId, userId } = req.params;

        if (!courseId || !userId) {
            return res.status(400).json({ error: 'Course ID and User ID required' });
        }

        const { data, error } = await supabase
            .from('lesson_progress')
            .select('lesson_id, completed_at')
            .eq('user_id', userId)
            .eq('course_id', courseId);

        if (error) throw error;

        return res.json(data);

    } catch (error: any) {
        console.error('Error fetching progress:', error);
        return res.status(500).json({ error: 'Failed to fetch progress' });
    }
};
