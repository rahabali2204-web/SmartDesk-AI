
// Load saved tickets from browser storage
let tickets = JSON.parse(
  localStorage.getItem("smartDeskTickets") || "[]"
);

// Display saved tickets and statistics when page opens
displayTickets();
updateStatistics();

// Analyze customer message
async function analyzeMessage() {
  const messageInput = document.getElementById("customerMessage");
  const message = messageInput.value.trim();

  const button = document.getElementById("analyzeBtn");
  const status = document.getElementById("status");

  if (!message) {
    status.textContent = "Please enter a customer message.";
    status.style.color = "red";
    return;
  }

  button.disabled = true;
  button.textContent = "Analyzing...";

  status.textContent = "Gemini AI is analyzing your message...";
  status.style.color = "#2563eb";

  try {
    const response = await fetch("/api/support", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Something went wrong.");
    }

    const result = data.result;

    // Display AI results
    document.getElementById("category").textContent = result.category;
    document.getElementById("sentiment").textContent = result.sentiment;
    document.getElementById("summary").textContent = result.summary;
    document.getElementById("reply").textContent = result.reply;

    // Display priority badge
    const priorityElement = document.getElementById("priority");

    priorityElement.textContent = result.priority;
    priorityElement.className = "priority-badge";

    priorityElement.classList.add(
      "priority-" + result.priority.toLowerCase()
    );

    // Create ticket
    const ticket = {
      id: Date.now(),
      message: message,
      category: result.category,
      sentiment: result.sentiment,
      priority: result.priority,
      summary: result.summary,
      reply: result.reply,
      date: new Date().toLocaleString()
    };

    // Save ticket
    tickets.unshift(ticket);

    localStorage.setItem(
      "smartDeskTickets",
      JSON.stringify(tickets)
    );

    // Update dashboard
    displayTickets();
    updateStatistics();

    status.textContent = "Analysis completed successfully!";
    status.style.color = "green";

  } catch (error) {
    status.textContent = error.message;
    status.style.color = "red";

  } finally {
    button.disabled = false;
    button.textContent = "Analyze Message";
  }
}

// Display ticket history
function displayTickets() {
  const history = document.getElementById("ticketHistory");

  if (tickets.length === 0) {
    history.innerHTML =
      "<p>No tickets yet. Analyze your first customer message!</p>";
    return;
  }

  history.innerHTML = "";

  tickets.forEach((ticket) => {
    const ticketCard = document.createElement("div");
    ticketCard.className = "ticket-card";

    const title = document.createElement("h3");
    title.textContent = "Ticket #" + ticket.id;

    const date = document.createElement("p");
    date.textContent = "Date: " + ticket.date;

    const message = document.createElement("p");
    message.textContent = "Customer: " + ticket.message;

    const details = document.createElement("p");
    details.textContent =
      "Category: " + ticket.category +
      " | Priority: " + ticket.priority;

    ticketCard.append(title, date, message, details);
    history.appendChild(ticketCard);
  });
}

// Update dashboard statistics
function updateStatistics() {
  const total = tickets.length;

  const urgent = tickets.filter(
    ticket => ticket.priority.toLowerCase() === "urgent"
  ).length;

  const other = total - urgent;

  document.getElementById("totalTickets").textContent = total;
  document.getElementById("urgentTickets").textContent = urgent;
  document.getElementById("otherTickets").textContent = other;
}

// Clear ticket history
function clearHistory() {
  if (!confirm("Are you sure you want to clear all ticket history?")) {
    return;
  }

  tickets = [];

  localStorage.removeItem("smartDeskTickets");

  displayTickets();
  updateStatistics();
}

