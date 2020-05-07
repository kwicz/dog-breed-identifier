import React, { useState, useRef, useReducer } from "react";
import * as mobilenet from "@tensorflow-models/mobilenet";
import "./App.css";
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import CardActionArea from '@material-ui/core/CardActionArea';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import Loop from '@material-ui/icons/Loop';
import PublishIcon from '@material-ui/icons/Publish';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    flex: '1 0 auto',
  },
  cover: {
    width: 151,
  }
}));

const machine = {
  initial: "initial",
  states: {
    initial: { on: { next: "loadingModel" } },
    loadingModel: { on: { next: "modelReady" } },
    modelReady: { on: { next: "imageReady" } },
    imageReady: { on: { next: "identifying" }, showImage: true },
    identifying: { on: { next: "complete" } },
    complete: { on: { next: "modelReady" }, showImage: true, showResults: true }
  }
};

function App() {
  // Constants for styling
  const classes = useStyles();
  const theme = useTheme();
  // Constants for state
  const [results, setResults] = useState([]);
  const [imageURL, setImageURL] = useState(null);
  const [model, setModel] = useState(null);
  const imageRef = useRef();
  const inputRef = useRef();

  const reducer = (state, event) =>
    machine.states[state].on[event] || machine.initial;

  const [appState, dispatch] = useReducer(reducer, machine.initial);
  const next = () => dispatch("next");

  const loadModel = async () => {
    next();
    const model = await mobilenet.load();
    setModel(model);
    next();
  };

  const identify = async () => {
    next();
    const results = await model.classify(imageRef.current);
    setResults(results);
    next();
  };

  const reset = async () => {
    setResults([]);
    next();
  };

  const upload = () => inputRef.current.click();

  const handleUpload = event => {
    const { files } = event.target;
    if (files.length > 0) {
      const url = URL.createObjectURL(event.target.files[0]);
      setImageURL(url);
      next();
    }
  };

  const actionButton = {
    initial: { action: loadModel, text: "Load Model", icon: <ArrowForwardIcon /> },
    loadingModel: { text: "Loading Model...", icon: <Loop /> },
    modelReady: { action: upload, text: "Upload Image", icon: <PublishIcon /> },
    imageReady: { action: identify, text: "Identify Breed", icon: <ArrowForwardIcon /> },
    identifying: { text: "Identifying...", icon: <Loop /> },
    complete: { action: reset, text: "Reset", icon: <ArrowForwardIcon /> }
  };

  const { showImage, showResults } = machine.states[appState];

  return (
    <Card className={classes.root}>
      <div className={classes.details}>
        <CardContent className={classes.content}>
          <Typography component="h5" variant="h5">
            Find your dog's Breed
          </Typography>
        </CardContent>
        <CardActionArea>
          <Button variant="contained" color="primary" onClick={actionButton[appState].action || (() => {})}>
            {actionButton[appState].text} 
            {actionButton[appState].icon}
          </Button>
        </CardActionArea>
        {showResults && (
          <ul>
            {results.map(({ className, probability }) => (
              <li key={className}>{`${className}: %${(probability * 100).toFixed(
                2
              )}`}</li>
            ))}
          </ul>
          )}    
      </div>
      <CardMedia>
        {showImage && <img src={imageURL} alt="upload-preview" ref={imageRef} />}
          <input
            type="file"
            accept="image/*"
            capture="camera"
            onChange={handleUpload}
            ref={inputRef}
          />
      </CardMedia>
    </Card>
  );
}

export default App;