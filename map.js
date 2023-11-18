"use strict";

const workoutContainer = document.querySelector(".workouts");
const form = document.querySelector(".form");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form-input_distance");
const inputDuration = document.querySelector(".form-input_duration");
const inputCadence = document.querySelector(".form-input_cadence");
const inputElevation = document.querySelector(".form-input_elevation");

class Workout {
  date = new Date();
  // mannualy creating id..
  id = (Date.now() + "").slice(-10);
  // id = Date.now();
  clicks =0;
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription(){
    const months = ['January', 'Febuary', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
  }

  // count no of particular workout activity got clicked
  click(){
    this.clicks++;
  }
}
// const workout = new Workout();

class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.distance / this.duration;
    return this.pace;
  }
}

class Cycling extends Workout {
  type ="cycling";
  constructor(coords, distance, duration, elevationgain) {
    super(coords, distance, duration);
    this.elevationgain = elevationgain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

//   TEST......
// const run1 = new Running([22, 75], 4, 3, 200);
// const cycle1 = new Cycling([22, 75], 4, 3, 200);
// console.log(run1, cycle1);

// let map, mapEvent;

class App {
  #map;
  #mapEvent;
  #ZoomLevel = 13;
  #Workouts =[];
  constructor() {
    // get User's location
    this._getPosition();

    // Get Data from localstorage
    this._getlocalStorage();

    // Attaching  event handler  
    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevation.bind(this));
    workoutContainer.addEventListener("click", this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Could not get location");
        }
      );
    }
  }

  _loadMap(position) {
    console.log(position);
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
    const coords = [latitude, longitude];
    // console.log(this);
    //rendering map
    this.#map = L.map("map").setView(coords, this.#ZoomLevel);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // adding event handle on  map click
    this.#map.on("click", this._showForm.bind(this));
    /// render marker on map of activity saved
    this.#Workouts.forEach(work =>{ this._renderWorkoutMarker(work);});

  }

  //display Form when
  _showForm(mapE) {
    // event handler for form submission..
    this.#mapEvent = mapE;
    // console.log(this.#mapEvent);
    form.classList.remove("hidden");
    inputDistance.focus();
  }

    // clearing values from input field 
  _clearInputField(){
    inputDistance.value =
    inputDuration.value =
    inputCadence.value =
    inputElevation.value =
      " ";
  inputDistance.focus();
  }

  _hideForm(){
    this._clearInputField();
    form.style.display = 'none';
    form.classList.add("hidden");
    setTimeout(()=> form.style.display = 'grid',1000);
  }

  // toggle elevation on option change cycling || running
  _toggleElevation() {
    // console.log(inputCadence.closest(".form-row"));
    inputElevation.closest(".form-row").classList.toggle("form-row-hidden");
    inputCadence.closest(".form-row").classList.toggle("form-row-hidden");
    this._clearInputField();
  }

  _newWorkout(Event) {
    Event.preventDefault();
    // check for input b/w (0-9).
    const InputValidator = (...params) =>
      params.every((inp) => Number.isFinite(inp));
    // check for inpute mustr be +ve
    const checkPositive = (...inputs) => inputs.every((inp) => inp > 0);

    // get data
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
     // console.log(mapEvent)
    //destructuring lat and lng from mapevent object
    const { lat, lng } = this.#mapEvent.latlng;

    //to store workout activity data
    let workoutActivity;

    // check activity type and according take rest of data
    //for running 
    if (type === "running") {
      const cadence = +inputCadence.value;
      if (
        !InputValidator(distance, duration, cadence) ||
        !checkPositive(distance, duration, cadence)
      )
        return alert("Input must be a Positive numbers only");
        workoutActivity = new Running([lat,lng], distance,duration, cadence);
    }
    //for cycling
    if (type === "cycling") {
      const elevation = +inputElevation.value;
      if (
        !InputValidator(distance, duration, elevation) ||
        !checkPositive(distance, duration)
      )
        return alert("Input must be a Positive numbers only");
        workoutActivity = new Cycling([lat,lng], distance,duration, elevation);

    }
     
    // Pushing data to Workouts array
    this.#Workouts.push(workoutActivity);
    // console.log(workoutActivity);

    // marking on map at specific location
    this._renderWorkoutMarker(workoutActivity);

    // render workout activity list 
    this._renderWorkout(workoutActivity);

    //hide form
    this._hideForm();

    // save data into localstorage
    this._setLocalStorage();
    
  }

   // Adding marker on map at our clicked location..
   _renderWorkoutMarker(workoutActivity){
    L.marker(workoutActivity.coords)
    .addTo(this.#map)
    .bindPopup(
      L.popup({
        // maxWidth: 150,
        // minWidth: 50,
        // maxHeight: 50,  manually added height..
        autoClose: false,
        closeOnClick: false,
        className: ( workoutActivity.type +`-popup`)
      })
    )
    .setPopupContent(`${workoutActivity.type === 'running' ? '🏃‍♂️': '🚴‍♀️'}${workoutActivity.description}`)
    .openPopup();
  }

  _renderWorkout(workoutActivity){
        let html = `
        <li class="workout workout--${workoutActivity.type}" data-id="${workoutActivity.id}">
        <h2 class="workout__title">${workoutActivity.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${workoutActivity.type === 'running' ? '🏃‍♂️': '🚴‍♀️'} </span>
          <span class="workout__value">${workoutActivity.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workoutActivity.duration}</span>
          <span class="workout__unit">min</span>
        </div>
        `;

        if(workoutActivity.type === 'running'){
          html = html + `
          <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workoutActivity.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workoutActivity.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
        </li>
          `;
        }

        if(workoutActivity.type === 'cycling'){
          html = html + `
          <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workoutActivity.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workoutActivity.elevationgain}</span>
          <span class="workout__unit">m</span>
        </div>
        </li>
          `;
        } 

        form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e){
    const workoutEl = e.target.closest('.workout');
    // console.log(workoutEl);

    if(!workoutEl)return;
    // console.log(workoutEl.dataset.id);
    // console.log(this.#Workouts.find(work => console.log(work)));

    const workout = this.#Workouts.find(work => work.id === workoutEl.dataset.id); 
    // console.log(workout);
    this.#map.setView(workout.coords, this.#ZoomLevel, {
      animate: true,
      pan:{
        duration:1
      }
    })
  
    // it will not work bcoz on changing object -> string -> object..it lost its prototype
    // workout.click();
  }

  _setLocalStorage(){
    localStorage.setItem('workoutData', JSON.stringify(this.#Workouts));
  }

  _getlocalStorage(){
    const data = JSON.parse(localStorage.getItem('workoutData'));
    //  console.log(data);
     if(!data) return;
     this.#Workouts = data;
     this.#Workouts.forEach(work =>{ this._renderWorkout(work);});
  }

  reset(){
    localStorage.removeItem('workoutData');
    location.reload();
   }
}

const app = new App();
