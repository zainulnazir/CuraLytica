import os
import json
import asyncio
from mcp import StdioServerParameters
from mcp.client.stdio import stdio_client
from mcp import ClientSession

PLUGIN_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../plugins"))

class PluginManager:
    def __init__(self):
        self.plugins = {}

    def discover_plugins(self):
        """Scans the plugins directory for manifest.json files."""
        if not os.path.exists(PLUGIN_DIR):
            return []
        
        discovered = []
        for plugin_name in os.listdir(PLUGIN_DIR):
            plugin_path = os.path.join(PLUGIN_DIR, plugin_name)
            manifest_path = os.path.join(plugin_path, "manifest.json")
            
            if os.path.isdir(plugin_path) and os.path.exists(manifest_path):
                with open(manifest_path, 'r') as f:
                    try:
                        manifest = json.load(f)
                        manifest['path'] = plugin_path
                        # Ensure entry point path is absolute
                        manifest['entry_point_abs'] = os.path.join(plugin_path, manifest['entry_point'])
                        discovered.append(manifest)
                    except json.JSONDecodeError:
                        print(f"Error parsing manifest for {plugin_name}")
        
        self.plugins = {p['name']: p for p in discovered}
        return discovered

    def get_plugin_by_tool(self, tool_name):
        """Finds which plugin provides a specific tool."""
        for name, plugin in self.plugins.items():
            if tool_name in plugin.get('tools', []):
                return plugin
        return None

    async def run_tool(self, tool_name, arguments):
        """Executes a tool from the appropriate plugin."""
        plugin = self.get_plugin_by_tool(tool_name)
        if not plugin:
            raise ValueError(f"Tool '{tool_name}' not found in any plugin.")

        server_params = StdioServerParameters(
            command=plugin['entry_point_abs'],
            args=[],
            env=os.environ.copy()
        )

        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                result = await session.call_tool(tool_name, arguments=arguments)
                return result.content[0].text

# Global instance
manager = PluginManager()
manager.discover_plugins()
