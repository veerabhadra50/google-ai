# Prompt 2: For Google AI Studio (Full-Stack App Generation with Stitch Design)

Once you export your design code/assets from Stitch, paste them along with the prompt below into **Google AI Studio** to build the interactive, working application.

***

Build a complete, fully interactive React + Tailwind CSS web application for a **Chit Fund Field-Force CRM & Live Worker Tracking System**, strictly following the layout, color palette, and component styling of the attached Stitch design export.

Ensure all features work end-to-end in the browser with rich realistic mock data (Indian Chit Fund context using ₹ INR, realistic names, chit group IDs like "GRP-5L-14", and city coordinates) plus a live interactive simulation engine:

1. **Dual-View Mode Switcher (Top Header):**
   - Allow instant switching between **"Manager / Admin Command Center"** and **"Field Worker Mobile Simulator"** (or view both side-by-side) so I can test the complete workflow live.

2. **Manager Dashboard Features:**
   - **Live Interactive Map (using SVG/Canvas or Leaflet):** Display 5 field workers moving along routes in real time. Each marker shows worker name, status color (Green = Moving, Yellow = At Customer, Red Pulsing = Stationary Alert), and cash collected.
   - **Task & Enquiry Assignment Modal:** Allow the manager to create a new Chit Collection task or a New Customer Enquiry and assign it immediately to any worker. The task must instantly appear in that worker's mobile view.
   - **Inactivity Detection & Audio Warning System (CRITICAL):**
     - Implement a real-time movement monitor for every active worker.
     - Include a **"Simulate Worker Stop / Idle"** button for testing so I don't have to wait 15 minutes.
     - When a worker remains stationary beyond the threshold (e.g., 15 seconds in Demo Mode / 15 mins in Real Mode), automatically:
       1. Play a synthesized Web Audio API warning siren/alarm sound (include a Mute/Test Alarm button in the header).
       2. Display a flashing red Alert Banner on the Manager/Admin screen with the worker's name, idle duration, and location.
       3. Log an automated "Alert Message Sent to Manager & Admin" notification in the Alert Center and trigger a warning popup on the Field Worker's screen.

3. **Field Worker Mobile App Features:**
   - **Shift Toggle:** Start/End Shift (controls GPS tracking).
   - **My Tasks & Enquiries:** View assigned chit collections and leads. Clicking "Collect Payment" lets the worker enter Cash or UPI amount, updates the Manager's live revenue KPIs, resets the worker's idle timer, and moves their marker to the next task.
   - **Add New Enquiry:** Quick form for the worker to submit a new chit prospect from the field, immediately notifying the Manager.

**Technical Requirements:**
- Use clean, modular React components, Lucide icons, and Tailwind CSS matching the Stitch aesthetic.
- Use Web Audio API (`AudioContext`) to generate the warning alarm sound reliably without external broken audio links.
- Ensure zero console errors and smooth real-time state updates between the Manager view and Worker view.