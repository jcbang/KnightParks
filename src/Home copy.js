import React, { Component } from 'react';
import GoogleMapReact from 'google-map-react';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import { makeStyles } from '@material-ui/core/styles';

import locations from './mapLocations.json';
import graph from './mapGraph.json';

const axios = require('axios');

const AnyReactComponent = ({ text }) => <div>{text}</div>;
 
const useStyles = makeStyles(theme => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
  },
}));

export default function HomePage() {
  const classes = useStyles();

  const [currentClass, setClass] = React.useState();
  const [myMap, setMap] = React.useState();
  const [myMaps, setMaps] = React.useState();
  const [myRender, setRender] = React.useState();

  const getGarageStatus = async () => {
    // Make a request for a user with a given ID
    return axios.get('https://api.ucfgarages.com/')
      .then(function (response) {
        // handle success
        // console.log(response.data);

        return response.data;
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
  }

  const props = {
    center: {
      lat: 28.6014478,
      lng: -81.1996093
    },
    zoom: 16
  };

  const handleGoogleMapApi = (map, maps) => {
    setMap(map);
    setMaps(maps);
    setRender(new maps.DirectionsRenderer());
  }

  const handleDestinationChange = event => {
    setClass(event.target.value);

    let garageMap = new Map();
    let timeMap = new Map();
    let distanceMap = new Map();

    const status = getGarageStatus();
    status.then((result) => {
      result.garages.forEach((garage) => {
        console.log(garage.name + ", " + garage.percent_full);
        garageMap.set(garage.name, garage.percent_full);
      });
    }).then(() => {  
      // Get the closest garage
      // Best garage is calculated by distance and time spent parking,
      // garages 100% full should be excluded
      // Garages 90 - 100% full should take 30 minutes
      // Garages 80 - 90% full should take 15 minutes
      // Garages <80% full should take 10 minutes
      // Total value is calculated as parkingTime + timeToTravel
      // Avg human walking speed is 275 feet per minute
      // Return the min

      // Get the distance from CB1 to each garage
      for (let key in graph) {
        console.log(key + ": " + graph[key][event.target.value]);
        distanceMap.set(key, graph[key][event.target.value]);
      }

      let destinationLat = locations[event.target.value].lat;
      let destinationLng = locations[event.target.value].lng;
      const destLatLng = new myMaps.LatLng(destinationLat, destinationLng);

      // console.log(distanceMap.get('garageA')); prints 2100

      for (let key in graph) {
        let percentFull = garageMap.get(key);
        let timeToPark = 0;

        if (percentFull === 100) {
          // Exclude
        } else if (percentFull >= 90 && percentFull < 100) {
          timeToPark = 30;
        } else if (percentFull >= 80 && percentFull < 90) {
          timeToPark = 15;
        }

        console.log(key + ' is ' + percentFull + '% full, time to park in ' + key + ' is: ' + timeToPark);

        let originLat = locations[key].lat;
        let originLng = locations[key].lng;
        const originLatLng = new myMaps.LatLng(originLat, originLng);

        let destinationConfig = {
          origin: originLatLng,
          destination: destLatLng,
          travelMode: 'WALKING'
        };

        let directionsService = new myMaps.DirectionsService();

        directionsService.route(destinationConfig, function(result, status) {
          if (status == 'OK') {
            // console.log(result.routes[0].legs[0].duration.value);
            let timeToWalk = result.routes[0].legs[0].duration.value / 60;
            let totalTime = timeToWalk + timeToPark;

            console.log('Combined time to get from ' + event.target.value + ' to ' + key + ' is ' + totalTime);

            timeMap.set(key, totalTime);
          }
        });
        // let timeToWalk = distanceMap.get(key) / walkSpeedPerMinute;
        // let totalTime = timeToWalk + timeToPark;
      }
    }).then(() => {
      let minTime = 999999;
      let bestGarage = 'INVALID';

      // Get min time overall
      for (let key in graph) {
        console.log('Time map get ' + key + ': ' + timeMap.get(key));
        if (minTime > timeMap.get(key)) {
          minTime = timeMap.get(key);
          bestGarage = key;
        }
      }

      console.log('Min time overall is ' + minTime);

      console.log('Best garage is ' + bestGarage);

      let destinationLat = locations[event.target.value].lat;
      let destinationLng = locations[event.target.value].lng;
      const destLatLng = new myMaps.LatLng(destinationLat, destinationLng);

      let originLat = locations[bestGarage].lat;
      let originLng = locations[bestGarage].lng;

      const originLatLng = new myMaps.LatLng(originLat, originLng);

      let destinationConfig = {
          origin: originLatLng,
          destination: destLatLng,
          travelMode: 'WALKING'
        };

      let directionsService = new myMaps.DirectionsService();

      myRender.setMap(null);

      directionsService.route(destinationConfig, function(result, status) {
        console.log(result);
        console.log(result.routes[0].legs[0].duration.value);
        if (status == 'OK') {
          myRender.setDirections(result);
        }
      });

      myRender.setMap(myMap);
    });
  }

  return (
    <div style={{ height: '75vh', width: '100%' }}>
      <GoogleMapReact
        bootstrapURLKeys={{ key: 'AIzaSyCdyWf2tI9v43hPT2Ka_bkUOMdnis9aIoo' }}
        defaultCenter={props.center}
        defaultZoom={props.zoom}
        yesIWantToUseGoogleMapApiInternals 
        onGoogleApiLoaded={({ map, maps }) => handleGoogleMapApi(map, maps)}
      >
        <AnyReactComponent
          lat={59.955413}
          lng={30.337844}
          text="My Marker"
        />
      </GoogleMapReact>
      <FormControl className={classes.formControl}>
        <InputLabel id="demo-simple-select-label">Destination</InputLabel>
        <Select
          value={currentClass}
          onChange={handleDestinationChange}
        >
          <MenuItem value={'CB1'}>Classroom Building 1</MenuItem>
          <MenuItem value={'CB2'}>Classroom Building 2</MenuItem>
          <MenuItem value={'Business'}>Business 1/2</MenuItem>
          <MenuItem value={'Engineering'}>Engineering 1/2</MenuItem>
          <MenuItem value={'HEC'}>L3Harris Engineering Center</MenuItem>
          <MenuItem value={'MSB'}>Mathematical Sciences</MenuItem>
          <MenuItem value={'Library'}>Library</MenuItem>
          <MenuItem value={'SU'}>Student Union</MenuItem>
        </Select>
      </FormControl>
    </div>
  );
}
