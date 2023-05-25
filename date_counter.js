var startDate = new Date('2019-03-01');

function calculateExperience() {
  var currentDate = new Date();
  var diff = currentDate - startDate;
  var years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  var months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));

  document.getElementById('years').textContent = years;
  document.getElementById('months').textContent = months;
}

calculateExperience();