import React, { Component } from 'react';
import GoogleMapReact from 'google-map-react';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';

import locations from './mapLocations.json';
import graph from './mapGraph.json';

const axios = require('axios');

const AnyReactComponent = ({ text }) => <div>{text}</div>;
 
const useStyles = makeStyles(theme => ({
  root: {
    '& > *': {
      margin: theme.spacing(1),
    },
  },
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

  const handleDestinationChange = (destination) => {
    setClass(destination);

    let garageMap = new Map();
    let timeMap = new Map();
    let distanceMap = new Map();
    let walkSpeedPerMinute = 275;

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
        console.log(key + ": " + graph[key][destination]);
        distanceMap.set(key, graph[key][destination]);
      }

      // Manual Override for Demo:
      // garageMap.set('Garage C', 100);

      for (let key in graph) {
        let percentFull = garageMap.get(key);
        let timeToPark = 999999;

        if (percentFull === 100) {
          // Exclude
        } else if (percentFull >= 90 && percentFull < 100) {
          timeToPark = 30;
        } else if (percentFull >= 80 && percentFull < 90) {
          timeToPark = 15;
        } else {
          timeToPark = 0;
        }

        console.log(key + ' is ' + percentFull + '% full, time to park in ' + key + ' is: ' + timeToPark);

        let timeToWalk = distanceMap.get(key) / walkSpeedPerMinute;
        let totalTime = timeToWalk + timeToPark;

        console.log('Combined time to get from ' + destination + ' to ' + key + ' is ' + totalTime);

        timeMap.set(key, totalTime);
      }

      let minTime = 999999;
      let bestGarage = 'INVALID';

      // Get min time overall
      for (let key in graph) {
        if (minTime > timeMap.get(key)) {
          minTime = timeMap.get(key);
          bestGarage = key;
        }
      }

      console.log('Min time overall is ' + minTime);

      let originLat = locations[bestGarage].lat;
      let originLng = locations[bestGarage].lng;

      let destinationLat = locations[destination].lat;
      let destinationLng = locations[destination].lng;

      const originLatLng = new myMaps.LatLng(originLat, originLng);
      const destLatLng = new myMaps.LatLng(destinationLat, destinationLng);

      const destinationConfig = {
          origin: originLatLng,
          destination: destLatLng,
          travelMode: 'WALKING'
        };

      let directionsService = new myMaps.DirectionsService();

      myRender.setMap(null);

      directionsService.route(destinationConfig, function(result, status) {
        if (status == 'OK') {
          myRender.setDirections(result);
        }
      });

      myRender.setMap(myMap);
    });
  }

  const handleReset = () => {
    myRender.setMap(null);
    setClass('');
  }

  return (
    <div style={{ height: '75vh', width: '100%' }}>
      <GoogleMapReact
        bootstrapURLKeys={{ key: 'AIzaSyCdyWf2tI9v43hPT2Ka_bkUOMdnis9aIoo' }}
        center={props.center}
        zoom={props.zoom}
        yesIWantToUseGoogleMapApiInternals 
        onGoogleApiLoaded={({ map, maps }) => handleGoogleMapApi(map, maps)}
      >
        <AnyReactComponent
          lat={59.955413}
          lng={30.337844}
          text="My Marker"
        />
      </GoogleMapReact>
      <Grid
        container
        direction="column"
        justify="center"
        alignItems="center"
      >
        <Grid
          container
          direction="row"
          justify="center"
          alignItems="center"
        >
          <div className={classes.root}>
            <Button variant="contained" color="primary" onClick={() => handleDestinationChange('CB1')}>
              Classrooms 1
            </Button>
            <Button variant="contained" color="primary" onClick={() => handleDestinationChange('CB2')}>
              Classrooms 2
            </Button>
            <Button variant="contained" color="primary" onClick={() => handleDestinationChange('Library')}>
              Library
            </Button>
            <Button variant="contained" color="primary" onClick={() => handleDestinationChange('SU')}>
              Student Union
            </Button>
            <Button variant="contained" color="primary" onClick={() => handleDestinationChange('ENG')}>
              Engineering
            </Button>
            <Button variant="contained" color="primary" onClick={() => handleDestinationChange('Business')}>
              Business
            </Button>
            <Button variant="contained" color="primary" onClick={() => handleDestinationChange('HEC')}>
              Harris Center
            </Button>
            <Button variant="contained" color="primary" onClick={() => handleDestinationChange('MSB')}>
              Math Sciences
            </Button>
          </div>
        </Grid>
        <Button color="secondary" onClick={() => handleReset()}>Reset</Button>
      </Grid>
    </div>
  );
}
