// Convert 24-hour format to 12-hour format with AM/PM
export const to12Hour = (time24) => {
  if (!time24) return '';
  const [hours24, minutes] = time24.split(':');
  const hours = parseInt(hours24);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes} ${period}`;
};

// Convert 12-hour format with AM/PM to 24-hour format
export const to24Hour = (time12) => {
  if (!time12) return '';
  const [time, period] = time12.split(' ');
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours);
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

// Check if a time is between two other times (all in 24-hour format)
export const isTimeBetween = (time, start, end) => {
  const timeMinutes = convertTimeToMinutes(time);
  const startMinutes = convertTimeToMinutes(start);
  const endMinutes = convertTimeToMinutes(end);
  
  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
};

// Convert time string to minutes for comparison
export const convertTimeToMinutes = (time) => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Format date to a readable string
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  // Parse the date string and adjust for local timezone
  const date = new Date(dateString);
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
  
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

// Calculate time overlap between two time ranges
export const getTimeOverlap = (start1, end1, start2, end2) => {
  // Convert all times to minutes for easier comparison
  const start1Minutes = convertTimeToMinutes(start1);
  const end1Minutes = convertTimeToMinutes(end1);
  const start2Minutes = convertTimeToMinutes(start2);
  const end2Minutes = convertTimeToMinutes(end2);

  // Find the latest start time and earliest end time
  const overlapStart = Math.max(start1Minutes, start2Minutes);
  const overlapEnd = Math.min(end1Minutes, end2Minutes);

  // If there's no overlap, return null
  if (overlapStart >= overlapEnd) {
    return null;
  }

  // Convert overlap times back to HH:mm format
  const formatMinutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  return {
    start: formatMinutesToTime(overlapStart),
    end: formatMinutesToTime(overlapEnd),
    duration: overlapEnd - overlapStart
  };
};
