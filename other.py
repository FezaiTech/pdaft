class PDA:
    def __init__(self):
        self.stack = ['Z']
        self.state = 'q0'

    def transition(self, char):
        if self.state == 'q0':
            if char == '(':
                self.stack.append('(')
            elif char == ')':
                if self.stack[-1] == '(':
                    self.stack.pop()
                else:
                    return False
        return True

    def validate(self, expression):
        for char in expression:
            if not self.transition(char):
                return False
        if self.state == 'q0' and self.stack == ['Z']:
            return True
        return False

# Test the PDA with a valid and an invalid expression
pda = PDA()
expression1 = "(a + b) * (c / d)"
expression2 = "(a + b) * (c / d))"

print(f"Expression: {expression1} is {'valid' if pda.validate(expression1) else 'invalid'}")
print(f"Expression: {expression2} is {'valid' if pda.validate(expression2) else 'invalid'}")
