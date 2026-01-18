
export function isValidPhone(phone) {
  const regex = /^(0[3|5|7|8|9][0-9]{8}|(\+84)[3|5|7|8|9][0-9]{8})$/;
  return !!phone && regex.test(phone);
}


export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return !!email && regex.test(email);
}