import cron from 'node-cron';
import Appointment from '../models/Appointment.js';

// Run every minute
const startCronJobs = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      
      // Find appointments that are still pending
      const pendingAppointments = await Appointment.find({ status: 'pending' });

      for (const appointment of pendingAppointments) {
        // Construct a full Date object using the appointmentDate and appointmentTime
        const apptDate = new Date(appointment.appointmentDate);
        const [hours, minutes] = appointment.appointmentTime.split(':');
        apptDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

        // Simple comparison: if the appointment start time is in the past
        if (apptDate < now) {
          appointment.status = 'not_responded';
          appointment.cancellationReason = 'Automatically marked as not responded due to time elapsed.';
          await appointment.save();
          console.log(`Appointment ${appointment._id} marked as not_responded.`);
        }
      }
    } catch (error) {
      console.error('Error in appointment cron job:', error);
    }
  });
  
  console.log('Cron jobs started for appointment service.');
};

export default startCronJobs;
