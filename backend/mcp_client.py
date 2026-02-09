import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
import os

# Configuration for the MCP server
MCP_SERVER_SCRIPT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../mcp-medical-imaging/start_mcp.sh"))

async def analyze_image_with_mcp(image_path: str):
    """
    Connects to the Medical Imaging MCP server and requests an analysis.
    """
    server_params = StdioServerParameters(
        command=MCP_SERVER_SCRIPT,
        args=[],
        env=os.environ.copy() # Pass current env, though the script activates conda
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            # Initialize connection
            await session.initialize()

            # List tools to verify (optional, for debugging)
            # tools = await session.list_tools()
            
            # Call the analysis tool
            try:
                result = await session.call_tool("analyze_chest_xray", arguments={"image_path": image_path})
                return result.content[0].text
            except Exception as e:
                return f"MCP Error: {str(e)}"

if __name__ == "__main__":
    # Test block
    import sys
    if len(sys.argv) > 1:
        print(asyncio.run(analyze_image_with_mcp(sys.argv[1])))
    else:
        print("Usage: python mcp_client.py <image_path>")
