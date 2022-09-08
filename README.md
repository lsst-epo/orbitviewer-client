# Vera Rubin – OrbitViewer
This repo contains the structure of a FiL's toolkit instance for Vera Rubin's OrbitViewer front-end. 

[Check this page](https://eduprtas.notion.site/Setting-up-an-ubuntu-VM-instance-from-scratch-d33174b55d9c412bad04e6a3280b26fc) for quick how-to on setting up a new virtual ubuntu machine.

## App Structure
`CoreApp` is a WebGL App. The structure goes as follows:

1. `CoreApp`: Core functionalities of the app that you want to have in both editor and production mode.
2. `EditorApp`: Editor instance of the App. This is the one where users can log in and manage contents and settings.
3. `ProductionApp`: Production instance of the App. The main web app of the OrbitViewer.

*Note: In some cases we might have a SimulatorApp as well, i.e. for installation projects.*

## Folder Structure
Editor will store changes at `/uploads/`. Here we can store data files, 3D scenes, textures, videos, whatever is needed for the specific project.

These files are then loaded by core app as part of the contents of the application.

`/src/` contains the source code of the Applications.

`/server/` contains the NodeJS back-end for handling user sessions and files.

## Ui Sets and Components
We are currently basing our UI component system on [Tweakpane](https://cocopon.github.io/tweakpane/). We might change this for our own library later on.

## Scripts
Following scripts are available:

1. `yarn server` to launch back-end server only.
2. `yarn build` to build production-ready code.
3. `yarn dev` to launch dev mode environment.
4. `yarn clean` to clean all temp generated files & clean data cache.

When developing you can use the following urls: `http://localhost:8080/editor` for the editor app, and `http://localhost:8080/production` for the production one.

## Known Issues
Dev mode behaves sometimes a bit buggy when launching. Usually a `yarn clean && yarn build && yarn dev` fixes things... (To be resolved one day). Once running, it should run robustly.

## License
Copyright 2022, FiL Studio.

FiL is a studio with a creative tech soul. We build bespoke interactive journeys primarily using modern web technologies. We deliver tailored solutions for installations and on-line experiences using our internal toolkit + [ThreeJS](https://threejs.org).

FiL is the Catalan word for thread. We love threads cause we often talk about them when building applications and, at the same time, threads are something so organic, colourful and playful.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.