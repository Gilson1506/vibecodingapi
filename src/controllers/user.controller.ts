import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const getUserStats = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        // 1. Count Completed Lessons
        const { count: lessonsCount, error: lessonsError } = await supabase
            .from('lesson_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (lessonsError) throw lessonsError;

        // 2. Count Enrolled/Accessible Courses
        // Logic: specific enrollments OR all published courses if user has access (simplified for now)
        // For accurate "My Courses" we might need an enrollments table, but let's use user.has_access for now
        // If user has access, they "have" all courses? Or just display count of courses they started?
        // Let's count courses where they have at least one lesson progress for now to be "Active Courses"

        const { data: progressData } = await supabase
            .from('lesson_progress')
            .select('course_id')
            .eq('user_id', userId);

        const uniqueCourses = new Set(progressData?.map((p: { course_id: any }) => p.course_id));
        const coursesCount = uniqueCourses.size;

        // 3. User Data for Settings
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, full_name, email, phone, avatar_url, email_notifications, sms_notifications, created_at')
            .eq('id', userId)
            .single();

        if (userError) throw userError;

        // Calculate days since joining
        const joinDate = new Date(userData.created_at);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - joinDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return res.json({
            stats: {
                lessons: lessonsCount || 0,
                courses: coursesCount || 0,
                days: diffDays || 0
            },
            settings: {
                phone: userData.phone,
                email_notifications: userData.email_notifications,
                sms_notifications: userData.sms_notifications
            }
        });

    } catch (error: any) {
        console.error('Error fetching user stats:', error);
        return res.status(500).json({ error: 'Failed to fetch user stats' });
    }
};

export const updateUserProfile = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { full_name, phone, email_notifications, sms_notifications, avatar_url } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        const updates: any = {};
        if (full_name !== undefined) updates.full_name = full_name;
        if (phone !== undefined) updates.phone = phone;
        if (email_notifications !== undefined) updates.email_notifications = email_notifications;
        if (sms_notifications !== undefined) updates.sms_notifications = sms_notifications;
        if (avatar_url !== undefined) updates.avatar_url = avatar_url;

        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;

        return res.json({ success: true, user: data });

    } catch (error: any) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ error: 'Failed to update profile' });
    }
};
