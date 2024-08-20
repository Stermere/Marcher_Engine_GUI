# Marcher Engine GUI

Welcome to the repository for **Marcher Engine GUI**—the sleek and dynamic website that showcases my advanced checkers engine! 🎉

## Overview

Marcher Engine GUI is designed to present my checkers engine in an engaging and user-friendly way. Built with modern web technologies, this site provides a smooth and interactive experience for users to explore and play checkers.

## Key Features

- **Interactive Checkers Board:** Play against the engine and see its strategic prowess in action.
- **Dynamic Difficulty Levels:** Adjust the game’s challenge to match your skill level easily.
- **User-Friendly Design:** Enjoy a clean and intuitive interface designed for an optimal user experience.

## Setting up the environment

To get started with the Marcher Engine GUI, clone the repository and run the following commands:
```bash
git clone https://github.com/Stermere/Marcher_Engine_GUI
cd Marcher_Engine_GUI/client
npm install
npm run build
```

You will also need to install the requirements for the backend:
```bash
cd ../flask-server
python -m venv venv
venv\Scripts\activate
pyhton -m pip install -r requirements.txt
```

You can start the app with the following command:
```bash
./start.ps1
# or
python server.py
```

Finally, if you need to start the front end in development mode:
```bash
cd ../client
npm start
```
