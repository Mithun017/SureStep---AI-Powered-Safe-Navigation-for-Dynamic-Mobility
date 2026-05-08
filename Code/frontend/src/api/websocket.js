export class SureStepWS {
  constructor(sessionId, onMessage, onError, baseUrl = 'ws://localhost:8000') {
    this.sessionId = sessionId;
    this.onMessage = onMessage;
    this.onError = onError;
    this.baseUrl = baseUrl;
    this.ws = null;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.connect();
  }

  connect() {
    try {
      // Ensure baseUrl doesn't end with slash
      const cleanBase = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
      this.ws = new WebSocket(`${cleanBase}/ws/${this.sessionId}`);

      this.ws.onopen = () => {
        console.log("Connected to SureStep WebSocket");
        this.retryCount = 0;
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (this.onMessage) this.onMessage(data);
      };

      this.ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        if (this.onError) this.onError(err);
      };

      this.ws.onclose = () => {
        console.log("WebSocket closed");
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          console.log(`Retrying connection (${this.retryCount}/${this.maxRetries})...`);
          setTimeout(() => this.connect(), 2000);
        }
      };
    } catch (err) {
      console.error("Failed to establish WebSocket connection:", err);
    }
  }

  send(payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
