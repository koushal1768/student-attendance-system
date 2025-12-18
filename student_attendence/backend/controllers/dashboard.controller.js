import Attendance from '../models/Attendance.model.js';
import Session from '../models/Session.model.js';
import User from '../models/User.model.js';
import Subject from '../models/Subject.model.js';
import moment from 'moment';

// @desc    Get student dashboard data
// @route   GET /api/dashboard/student
// @access  Private (Student)
export const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Get today's date range
    const todayStart = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();

    // Get this month's date range
    const monthStart = moment().startOf('month').toDate();
    const monthEnd = moment().endOf('month').toDate();

    // Total attendance records
    const totalAttendance = await Attendance.countDocuments({ student: studentId });

    // Present count
    const presentCount = await Attendance.countDocuments({
      student: studentId,
      status: 'present'
    });

    // Absent count
    const absentCount = await Attendance.countDocuments({
      student: studentId,
      status: 'absent'
    });

    // Pending count
    const pendingCount = await Attendance.countDocuments({
      student: studentId,
      status: 'pending'
    });

    // Today's attendance
    const todayAttendance = await Attendance.find({
      student: studentId,
      date: { $gte: todayStart, $lte: todayEnd }
    })
      .populate('subject', 'name code')
      .populate('session', 'room startTime')
      .sort({ date: -1 });

    // Recent attendance (last 10)
    const recentAttendance = await Attendance.find({ student: studentId })
      .populate('subject', 'name code')
      .populate('teacher', 'firstName lastName')
      .populate('session', 'room startTime')
      .sort({ date: -1 })
      .limit(10);

    // Calculate attendance percentage
    const attendancePercentage = totalAttendance > 0
      ? ((presentCount / totalAttendance) * 100).toFixed(2)
      : 0;

    // Get monthly statistics
    const monthlyAttendance = await Attendance.find({
      student: studentId,
      date: { $gte: monthStart, $lte: monthEnd }
    });

    const monthlyPresent = monthlyAttendance.filter(a => a.status === 'present').length;
    const monthlyTotal = monthlyAttendance.length;
    const monthlyPercentage = monthlyTotal > 0
      ? ((monthlyPresent / monthlyTotal) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalClasses: totalAttendance,
          present: presentCount,
          absent: absentCount,
          pending: pendingCount,
          attendancePercentage: parseFloat(attendancePercentage)
        },
        todayAttendance,
        recentAttendance,
        monthlyStats: {
          present: monthlyPresent,
          total: monthlyTotal,
          percentage: parseFloat(monthlyPercentage)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
};

// @desc    Get teacher dashboard data
// @route   GET /api/dashboard/teacher
// @access  Private (Teacher)
export const getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // Get today's date
    const today = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();

    // Get this week's date range
    const weekStart = moment().startOf('week').toDate();
    const weekEnd = moment().endOf('week').toDate();

    // Total students (from subjects)
    const subjects = await Subject.find({ teacher: teacherId })
      .populate('enrolledStudents', 'studentId firstName lastName');
    
    const allStudents = new Set();
    subjects.forEach(subject => {
      subject.enrolledStudents?.forEach(student => {
        allStudents.add(student._id.toString());
      });
    });
    const totalStudents = allStudents.size;

    // Today's attendance statistics
    const todaySessions = await Session.find({
      teacher: teacherId,
      startTime: { $gte: today, $lte: todayEnd }
    });

    // Get today's attendance
    const todayAttendance = await Attendance.find({
      teacher: teacherId,
      date: { $gte: today, $lte: todayEnd }
    })
      .populate('student', 'firstName lastName studentId')
      .populate('subject', 'name code');

    const presentToday = todayAttendance.filter(a => a.status === 'present').length;
    const absentToday = totalStudents > 0 ? totalStudents - presentToday : 0;
    const pendingToday = todayAttendance.filter(a => a.status === 'pending').length;

    // Weekly attendance data
    const weeklyData = [];
    for (let i = 0; i < 5; i++) {
      const dayStart = moment().startOf('week').add(i, 'days').startOf('day').toDate();
      const dayEnd = moment().startOf('week').add(i, 'days').endOf('day').toDate();
      
      const dayAttendance = await Attendance.find({
        teacher: teacherId,
        date: { $gte: dayStart, $lte: dayEnd }
      });

      const present = dayAttendance.filter(a => a.status === 'present').length;
      const absent = dayAttendance.filter(a => a.status === 'absent').length;
      
      weeklyData.push({
        day: moment().startOf('week').add(i, 'days').format('ddd'),
        present,
        absent
      });
    }

    // Attendance trend (last 4 weeks)
    const trendData = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = moment().subtract(i, 'weeks').startOf('week').toDate();
      const weekEnd = moment().subtract(i, 'weeks').endOf('week').toDate();
      
      const weekAttendance = await Attendance.find({
        teacher: teacherId,
        date: { $gte: weekStart, $lte: weekEnd }
      });

      const present = weekAttendance.filter(a => a.status === 'present').length;
      const total = weekAttendance.length;
      const percentage = total > 0 ? ((present / total) * 100).toFixed(0) : 0;
      
      trendData.push({
        week: `Week ${4 - i}`,
        attendance: parseFloat(percentage)
      });
    }

    // Today's active classes
    const activeClasses = await Session.find({
      teacher: teacherId,
      startTime: { $gte: today, $lte: todayEnd },
      status: { $in: ['active', 'pending'] }
    })
      .populate('subject', 'name code')
      .populate('studentsPresent.student', 'firstName lastName')
      .sort({ startTime: 1 });

    const classesWithStats = activeClasses.map(session => {
      const present = session.studentsPresent.filter(sp => sp.status === 'verified').length;
      const total = session.totalStudents || 0;
      const percentage = total > 0 ? ((present / total) * 100).toFixed(0) : 0;
      
      return {
        id: session._id,
        sessionId: session.sessionId,
        subject: session.subject?.name || 'Unknown',
        subjectCode: session.subject?.code || '',
        room: session.room,
        startTime: session.startTime,
        endTime: session.endTime,
        students: total,
        present,
        attendancePercentage: parseFloat(percentage),
        status: session.status
      };
    });

    // Calculate average attendance
    const avgAttendance = trendData.length > 0
      ? (trendData.reduce((sum, week) => sum + week.attendance, 0) / trendData.length).toFixed(0)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalStudents,
          presentToday,
          absentToday,
          pendingToday,
          averageAttendance: parseFloat(avgAttendance)
        },
        weeklyData,
        trendData,
        activeClasses: classesWithStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
};



