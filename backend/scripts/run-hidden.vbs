' Lançador invisível para tarefas agendadas — executa o comando recebido
' sem abrir janela de console (o Agendador de Tarefas abre uma janela preta
' quando chama node.exe/powershell.exe diretamente).
' Uso: wscript.exe run-hidden.vbs <exe> [args...]
Set sh = CreateObject("WScript.Shell")
cmd = ""
For i = 0 To WScript.Arguments.Count - 1
  cmd = cmd & """" & WScript.Arguments(i) & """ "
Next
sh.Run Trim(cmd), 0, False
