from flask import Flask, request, jsonify, render_template
import os


app = Flask(__name__)


class PDA:

    def __init__(self):
        self.stack = ['z']  # stack init
        self.state = 'z'  # state init
        self.logs = []  # logs init
        self.stage = 0  # stage init
        self.log_state('z', "init")  # add init log

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
        if self.state == 'z' and (char.isdigit() or char == '('):  # goes to q1 or q5 state
            if char == '(':
                self.state = 'q1'
                self.stack.append(char)  # add ( to stack
                self.log_state(char, "Push (")
            elif char.isdigit():
                self.state = 'q5'
                self.log_state(char, "Read Digit")

        # q1 state (
        elif self.state == 'q1' and (char.isdigit() or char == '('):  # q1 goes to q3 or q1 state
            if char.isdigit():
                self.state = 'q3'
                self.log_state(char, "Read Digit")
            elif char == '(':
                self.state = 'q1'
                self.stack.append(char)  # add ( to stack
                self.log_state(char, "Push (")

        # q2 state +-*/
        elif self.state == 'q2' and (char.isdigit() or char == '('):  # q2 goes to q3 or q1 state
            if char.isdigit():
                if self.logs and self.logs[-1]['char'] == "/":  # check zero division
                    if char == '0':
                        self.state = 'qf'  # Invalid state
                        self.log_state(char, "Invalid State Zero Division")
                    else:
                        self.state = 'q3'
                        self.log_state(char, "Read Digit")
                else:
                    self.state = 'q3'
                    self.log_state(char, "Read Digit")
            elif char == '(':
                self.state = 'q1'
                self.stack.append(char)  # add ( to stack
                self.log_state(char, "Push (")

        # q3 state digit
        elif self.state == 'q3' and (char in '+-*/' or char == ')' or char.isdigit()):  # q3 goes to q2 or q4 state
            if char in '+-*/':
                self.state = 'q2'
                self.log_state(char, "Read Operator")
            elif char == ')':
                self.state = 'q4'
                if self.stack and self.stack[-1] == '(':
                    self.stack.pop()  # pop ( in stack
                    self.log_state(char, "Pop )")
                else:
                    self.state = 'qf'  # Invalid state
                    self.log_state(char, "Invalid State")
            elif char.isdigit():
                self.state = 'q3'
                self.log_state(char, "Read Digit")

        # q4 state )
        elif self.state == 'q4' and (char in '+-*/' or char == ')'):  # q4 goes to q6 or q4 or finish state
            if char == ')':
                if self.stack and self.stack[-1] == '(':
                    self.stack.pop()   # pop ( in stack
                    self.log_state(char, "Pop )")
                else:
                    self.state = 'qf'  # Invalid state
                    self.log_state(char, "Invalid State")
            elif char in '+-*/':
                self.state = 'q6'
                self.log_state(char, "Read Operator")

        # q5 state digit
        elif self.state == 'q5' and (char in '+-*/' or char.isdigit()):  # q5 goes to q6 or q5 state
            if char in '+-*/':
                self.state = 'q6'
                self.log_state(char, "Read Operator")
            elif char.isdigit():
                self.state = 'q5'
                self.log_state(char, "Read Digit")

        # q6 state +-*/
        elif self.state == 'q6' and (char.isdigit() or char == '('):  # q6 goes to q5 or q1 state
            if char.isdigit():
                if self.logs and self.logs[-1]['char'] == "/":  # check zero division
                    if char == '0':
                        self.state = 'qf'  # Invalid state
                        self.log_state(char, "Invalid State zero division")
                    else:
                        self.state = 'q5'
                        self.log_state(char, "Read Digit")
                else:
                    self.state = 'q5'
                    self.log_state(char, "Read Digit")
            elif char == '(':
                self.state = 'q1'
                self.stack.append(char)  # add ( to stack
                self.log_state(char, "Push (")

        # qf state
        else:
            self.state = 'qf'  # Invalid state
            self.log_state('% sqf' % char, "Invalid State")

        return self.state == 'qf'  # result for last state
        print(self.stack)

    def is_valid(self):
        # if the final state is not qf but there are invalid conditions, qf state is created
        if self.state != 'qf' and (len(self.stack) != 1 or (len(self.stack) == 1 and (self.state != 'q5' and self.state != 'q4'))):
            self.state = 'qf'
            self.log_state('qf', "Invalid State")

        #  it returns true or false depending on whether it is valid or invalid
        return self.state != 'qf' and len(self.stack) == 1 and self.stack[0] == 'z' and (self.state == 'q5' or self.state == 'q4')

    #  saves the log records as txt when you enter each new statement.
    def write_logs_to_file(self):
        with open("logs.txt", "w") as log_file:
            for log in self.logs:
                log_file.write(
                    f"Stage: {log['stage']}, State: {log['state']}, Char: {log['char']}, Log: {log['log']}, Stack: {log['stack']}\n")
                #  example log : Stage: 1, State: z, Char: z, Log: init, Stack: z


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

    #  set log.txt
    pda.write_logs_to_file()

    #  set response
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

    #  The PDA simulation supports the following characters:
    # Digits (0-9)
    # Operators (+, -, *, /)
    # Parentheses (())
    # Positive Numbers

