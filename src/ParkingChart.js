import React from 'react';
import Chart from "react-google-charts";
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';

const axios = require('axios');

const placeholder = [
  ["Garage", "Percent Full", { role: "style" }],
  ["Garage A", 0, "#b87333"], // RGB value
  ["Garage B", 0, "silver"], // English color name
  ["Garage C", 0, "gold"],
  ["Garage D", 0, "color: #e5e4e2"] // CSS-style declaration
];

export default function ParkingChart() {
  const [myData, setData] = React.useState(placeholder);

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

    const status = getGarageStatus();
    status.then((result) => {
      let data = [];
      let headers = ["Garage", "Percent Full", { role: "style" }];
      data.push(headers);

      result.garages.forEach((garage) => {
        let field = [];

        field.push(garage.name);
        field.push(garage.percent_full);
        field.push("gold");

        data.push(field);
      });

      setData(data);
    });

    return (
        <div className="Chart">
          <Chart
            chartType="ColumnChart"
            width="100%"
            height="500px"
            data={myData}
          />
          <br></br>
          <Grid
            container
            direction="row"
            justify="center"
            alignItems="center"
          >
            <Typography variant="h4" gutterBottom>
              Parking Availability
            </Typography>
          </Grid>

        </div>
      );
}