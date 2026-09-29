# Render with: vhs docs/demo.tape  (run from the repository root)
# Each step shows one trimmed view of the real gate output; see docs/demo-gif.sh.
Output docs/assets/factory-demo.gif
Set Shell "bash"
Set FontSize 22
Set Width 1200
Set Height 560
Set Padding 20
Set Theme "Dracula"
Set TypingSpeed 25ms

Hide
Type "PS1='$ '" Enter
Type "clear" Enter
Show

Type "# 1. The agent claims: delivered"
Enter
Sleep 800ms
Type "bash docs/demo-gif.sh false"
Enter
Sleep 6s

Hide
Type "clear" Enter
Show
Type "# 2. Same gate, honest record"
Enter
Type "bash docs/demo-gif.sh honest"
Enter
Sleep 4s

Hide
Type "clear" Enter
Show
Type "# 3. The gate had its own bug"
Enter
Type "bash docs/demo-gif.sh bug"
Enter
Sleep 4s
