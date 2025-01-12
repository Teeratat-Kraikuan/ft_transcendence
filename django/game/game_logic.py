class PongGame:
    """
    Pure Python Pong logic for a single match.
    """

    def __init__(self):
        # For simplicity, treat our field as ~20 wide x 12 high in 2D
        self.left_bound = -9.0
        self.right_bound = 9.0
        self.top_bound = 5.5
        self.bottom_bound = -5.5

        self.final_score = 3  # Example: first to 3 wins

        # Paddle data
        self.paddle_width = 0.5
        self.paddle_height = 2.0
        self.paddle_speed = 0.25

        # Paddle positions
        self.left_paddle_x = -8.0
        self.right_paddle_x = 8.0
        self.left_paddle_y = 0.0
        self.right_paddle_y = 0.0

        # Ball data
        self.ball_size = 0.5
        self.ball_x = 0.0
        self.ball_y = 0.0
        self.ball_vx = 0.15
        self.ball_vy = 0.15

        # Scores
        self.p1_score = 0
        self.p2_score = 0

        self.game_over = False

    def reset_ball(self):
        """Center the ball and reverse its horizontal direction."""
        self.ball_x = 0.0
        self.ball_y = 0.0
        self.ball_vx *= -1

    def move_paddle(self, paddle_id, direction):
        """Move left or right paddle up/down."""
        if self.game_over:
            return

        # Which paddle?
        if paddle_id == 1:
            # Left paddle
            if direction == "UP":
                self.left_paddle_y += self.paddle_speed
            elif direction == "DOWN":
                self.left_paddle_y -= self.paddle_speed

            # Clamp
            half_h = self.paddle_height / 2
            if self.left_paddle_y + half_h > self.top_bound:
                self.left_paddle_y = self.top_bound - half_h
            if self.left_paddle_y - half_h < self.bottom_bound:
                self.left_paddle_y = self.bottom_bound + half_h

        elif paddle_id == 2:
            # Right paddle
            if direction == "UP":
                self.right_paddle_y += self.paddle_speed
            elif direction == "DOWN":
                self.right_paddle_y -= self.paddle_speed

            # Clamp
            half_h = self.paddle_height / 2
            if self.right_paddle_y + half_h > self.top_bound:
                self.right_paddle_y = self.top_bound - half_h
            if self.right_paddle_y - half_h < self.bottom_bound:
                self.right_paddle_y = self.bottom_bound + half_h

    def update(self):
        """Advance the game by one tick (frame)."""
        if self.game_over:
            return

        # Move the ball
        self.ball_x += self.ball_vx
        self.ball_y += self.ball_vy

        # Top/bottom collision
        if self.ball_y + self.ball_size >= self.top_bound:
            self.ball_y = self.top_bound - self.ball_size
            self.ball_vy *= -1
        elif self.ball_y - self.ball_size <= self.bottom_bound:
            self.ball_y = self.bottom_bound + self.ball_size
            self.ball_vy *= -1

        # Left/right scoring
        if self.ball_x < self.left_bound:
            self.p2_score += 1
            self.reset_ball()
        elif self.ball_x > self.right_bound:
            self.p1_score += 1
            self.reset_ball()

        # Check paddle collisions
        self.check_paddle_collision()

        # Check for game over
        if self.p1_score >= self.final_score or self.p2_score >= self.final_score:
            self.game_over = True

    def check_paddle_collision(self):
        # Left paddle bounding box
        lp_top = self.left_paddle_y + self.paddle_height / 2
        lp_bottom = self.left_paddle_y - self.paddle_height / 2
        lp_right = self.left_paddle_x + self.paddle_width / 2

        # Right paddle bounding box
        rp_top = self.right_paddle_y + self.paddle_height / 2
        rp_bottom = self.right_paddle_y - self.paddle_height / 2
        rp_left = self.right_paddle_x - self.paddle_width / 2

        # If ball touches left paddle
        if (self.ball_x - self.ball_size <= lp_right and
            lp_bottom <= self.ball_y <= lp_top):
            # Bounce
            self.ball_x = lp_right + self.ball_size
            self.ball_vx *= -1

        # If ball touches right paddle
        if (self.ball_x + self.ball_size >= rp_left and
            rp_bottom <= self.ball_y <= rp_top):
            self.ball_x = rp_left - self.ball_size
            self.ball_vx *= -1

    def serialize_state(self):
        """Return state as a dict suitable for JSON."""
        return {
            "ball_x": self.ball_x,
            "ball_y": self.ball_y,
            "ball_vx": self.ball_vx,
            "ball_vy": self.ball_vy,
            "left_paddle_y": self.left_paddle_y,
            "right_paddle_y": self.right_paddle_y,
            "p1_score": self.p1_score,
            "p2_score": self.p2_score,
            "game_over": self.game_over,
        }