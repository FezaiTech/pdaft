from flask import Flask, request, jsonify, render_template


app = Flask(__name__)


class PDA:

    def __init__(self):
        self.stack = ['z']
        self.state = 'z'
        self.logs = []
        self.stage = 0
        self.log_state('z', "init")

    def log_state(self, char, operation):
        self.stage += 1
        log_entry = {
            "stage": self.stage,
            "state": self.state,
            "char": char,
            "log": operation,
            "stack": ''.join(self.stack)
        }
        self.logs.append(log_entry)

    def transition(self, char):
        # z init state
        if self.state == 'z' and (char.isdigit() or char == '('):
            if char == '(':
                self.state = 'q1'
                self.stack.append(char)
                self.log_state(char, "Push (")
            elif char.isdigit():
                self.state = 'q5'
                self.log_state(char, "Read Digit")

        # q1 state
        elif self.state == 'q1' and (char.isdigit() or char == '('):
            if char.isdigit():
                self.state = 'q3'
                self.log_state(char, "Read Digit")
            elif char == '(':
                self.state = 'q1'
                self.stack.append(char)
                self.log_state(char, "Push (")

        # q2 state
        elif self.state == 'q2' and (char.isdigit() or char == '('):
            if char.isdigit():
                if self.logs and self.logs[-1]['char'] == "/":
                    if char == '0':
                        self.state = 'qf'
                        self.log_state(char, "Invalid State Zero Division")
                    else:
                        self.state = 'q3'
                        self.log_state(char, "Read Digit")
                else:
                    self.state = 'q3'
                    self.log_state(char, "Read Digit")
            elif char == '(':
                self.state = 'q1'
                self.stack.append(char)
                self.log_state(char, "Push (")

        # q3 state
        elif self.state == 'q3' and (char in '+-*/' or char == ')' or char.isdigit()):
            if char in '+-*/':
                self.state = 'q2'
                self.log_state(char, "Read Operator")
            elif char == ')':
                self.state = 'q4'
                if self.stack and self.stack[-1] == '(':
                    self.stack.pop()
                    self.log_state(char, "Pop )")
                else:
                    self.state = 'qf'  # Invalid state
                    self.log_state(char, "Invalid State")
            elif char.isdigit():
                self.state = 'q3'
                self.log_state(char, "Read Digit")

        # q4 state
        elif self.state == 'q4' and (char in '+-*/' or char == ')'):
            if char == ')':
                if self.stack and self.stack[-1] == '(':
                    self.stack.pop()
                    self.log_state(char, "Pop )")
                else:
                    self.state = 'qf'  # Invalid state
                    self.log_state(char, "Invalid State")
            elif char in '+-*/':
                self.state = 'q6'
                self.log_state(char, "Read Operator")

        # q5 state
        elif self.state == 'q5' and (char in '+-*/' or char.isdigit()):
            if char in '+-*/':
                self.state = 'q6'
                self.log_state(char, "Read Operator")
            elif char.isdigit():
                self.state = 'q5'
                self.log_state(char, "Read Digit")

        # q6 state
        elif self.state == 'q6' and (char.isdigit() or char == '('):
            if char.isdigit():
                if self.logs and self.logs[-1]['char'] == "/":
                    if char == '0':
                        self.state = 'qf'
                        self.log_state(char, "Invalid State zero division")
                    else:
                        self.state = 'q5'
                        self.log_state(char, "Read Digit")
                else:
                    self.state = 'q5'
                    self.log_state(char, "Read Digit")
            elif char == '(':
                self.state = 'q1'
                self.stack.append(char)
                self.log_state(char, "Push (")

        # qf state
        else:
            self.state = 'qf'  # Invalid state
            self.log_state('% sqf' % char, "Invalid State")

        return self.state == 'qf'
        print(self.stack)

    def is_valid(self):
        if self.state != 'qf' and (len(self.stack) != 1 or (len(self.stack) == 1 and (self.state != 'q5' and self.state != 'q4'))):
            self.state = 'qf'
            self.log_state('qf', "Invalid State")

        return self.state != 'qf' and len(self.stack) == 1 and self.stack[0] == 'z' and (self.state == 'q5' or self.state == 'q4')


@app.route('/process', methods=['POST'])
def check_expression():
    expression = request.json.get('inputData')

    print(expression)

    pda = PDA()
    for char in expression:
        if pda.transition(char):
            break

    result = "Geçerli ifade." if pda.is_valid() else "Geçersiz ifade."
    if result == "Geçerli ifade.":
        pda.state = 'f'
        pda.log_state('f', "finish")

    response = {
        "message": result,
        "logs": pda.logs
    }
    print(pda.logs)
    return jsonify(response)


@app.route('/')
def index():
    return render_template('index.html')


if __name__ == "__main__":
    app.run(debug=True)