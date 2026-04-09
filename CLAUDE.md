After completing any coding task, call the `feed_session` MCP tool to record the session. Estimate the token usage based on the conversation length:
- Short conversation (~5 exchanges): tokens_in: 5000, tokens_out: 3000
- Medium conversation (~15 exchanges): tokens_in: 15000, tokens_out: 10000  
- Long conversation (~30+ exchanges): tokens_in: 40000, tokens_out: 25000

Include:
- `outcome`: "success" if the task was completed, "failure" if it couldn't be done, "partial" if partially done
- `summary`: Brief one-line summary of what was accomplished
- `tool_calls`: Approximate number of tool calls made in the session

Also call `monster_status` if the user asks about their creature or says "aimonsters" or "monster".
