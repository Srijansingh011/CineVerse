# CineVerse API — Seat Concurrency Test

## How to run
```bash
# Install artillery globally
npm install -g artillery

# Run the concurrency test
artillery run seat-concurrency.yml
```

## seat-concurrency.yml
```yaml
config:
  target: "http://localhost:4000"
  phases:
    - duration: 5
      arrivalCount: 50
      name: "50 concurrent users trying to lock same seat"
  defaults:
    headers:
      Authorization: "Bearer <TEST_TOKEN>"
      Content-Type: "application/json"

scenarios:
  - name: "Lock seat A1 in show"
    flow:
      - post:
          url: "/api/bookings/lock"
          json:
            showId: "SHOW_ID_PLACEHOLDER"
            seatIds:
              - "SEAT_A1_ID_PLACEHOLDER"
          capture:
            - json: "$.success"
              as: success
          expect:
            - statusCode:
                - 200
                - 409
```

## Expected result
- Exactly 1 request returns `200 { success: true }`
- The remaining 49 requests return `409 Conflict`
- Redis Lua atomic lock ensures no double booking
