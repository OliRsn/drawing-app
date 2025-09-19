## 🎯 Project Objective

Build a react js application for middle school teachers, which allows students to be randomly drawn for each lesson by adjusting the probabilities based on several criteria.

The app needs to remain simple but aesthetic, in order for the student to enjox the drawing process.

## Features
- Admin teacher page to add classes, students, drawing students test results  
- Drawing main page to draw a determines number of students for a given course
- Automaticly adjustable drawing probabilities based on : 
   - Past drawing results : a student already drawn should be less likely to be drawn a second time 
   - drawing test results : if a student had a bad grade, it should be more likely to be drawn again to improve it
- A nice looking page to visualize the updated student probabilities for the next course

## Design 
- A modern and clean design, using pastel colors

## ⚙️ Technical Constraints

- Vite + React JS for a fast and modern development experience
- Heroui components : https://www.heroui.com/
- Tailwind CSS for styling
- Well structured and organized css, no boostrap import or css library like this 
- SQlite local db for data persistance

## ✅ Planned Milestones

1. Set up the react local environment (Done)
3. Start to develop the main drawing page using fake data 
4. We'll then look at the next step together 

## 🤖 Gemini’s Expected Role

- Suggest design logic and assist on the app development 
- Make a beautiful and modern drawing animation 
- Assist with error handling and retry logic
- Optimize and refactor logic for reusability

---

### Backend Server

To start the backend server, run the following command from the root directory:

```bash
conda run -n drawer-app-env uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 &
```

You can access the Swagger UI from your Windows browser at the following address:

[http://172.26.138.71:8000/docs](http://172.26.138.71:8000/docs)

**Note:** The WSL IP address might change after a reboot. If you can't access the server, you can find the new IP address by running `ip addr` in your WSL terminal and looking for the `inet` address under the `eth0` interface. I will check the IP address for you each time you ask me to start the server.

