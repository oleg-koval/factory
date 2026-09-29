# Render with: vhs docs/demo.tape  (run from the repository root)
# The run is executed while hidden so the first frame already shows the output.
Output docs/assets/factory-demo.gif
Set Shell "bash"
Set FontSize 13
Set Width 1100
Set Height 640
Set Padding 16
Set Theme "Dracula"

Hide
Type "bash scripts/demo.sh"
Enter
Sleep 4s
Show
Sleep 8s
