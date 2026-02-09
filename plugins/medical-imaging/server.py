from mcp.server.fastmcp import FastMCP
import torch
import torchvision.transforms as transforms
from PIL import Image
import io
import base64
import numpy as np
import torchxrayvision as xrv

# Initialize FastMCP server
mcp = FastMCP("Medical Image Analysis")

# Global model cache
MODEL = None

def get_model():
    global MODEL
    if MODEL is None:
        try:
            # Load DenseNet model trained on multiple datasets (all)
            model = xrv.models.DenseNet(weights="densenet121-res224-all")
            model.eval()
            MODEL = model
        except Exception as e:
            raise RuntimeError(f"Failed to load xrv model: {e}")
    return MODEL

@mcp.tool()
def analyze_chest_xray(image_path: str) -> str:
    """
    Analyzes a chest X-ray image for common pathologies using TorchXRayVision.
    
    Args:
        image_path: Absolute path to the image file (JPG, PNG, DICOM)
    """
    try:
        # Load image using xrv's utility which handles various formats including DICOM
        img = xrv.datasets.normalize(xrv.datasets.getImage(image_path), 255) 
        
        # Check image shape and adjust for the model (1, 1, 224, 224)
        # xrv.datasets.getImage returns (H, W) or (H, W, C) depending on source
        
        if len(img.shape) > 2:
             # Convert to grayscale if multiple channels (takes mean properly)
             img = img.mean(2)
        
        # Add batch and channel dimensions: (1, 1, H, W)
        img = img[None, None, ...]
        
        # Resize if necessary (the model expects 224x224 but is somewhat flexible, 
        # but let's strictly resize to avoid tensor mismatches if any)
        # Note: xrv models often handle variable sizes but let's be safe or rely on xrv's internal handling if we trust it.
        # Actually, xrv.datasets.getImage doesn't resize. Let's use torch interpolation or xrv's recommendation.
        # For simplicity and robustness, we will convert to tensor then interpolate.
        
        input_tensor = torch.from_numpy(img)
        
        # Resize to 224x224 as expected by the specific model weights
        # Note: xrv usually handles this but explicit resize ensures compatibility
        # We need to handle the warning about antialias=True in newer pytorch
        # input_tensor = torch.nn.functional.interpolate(input_tensor, size=(224, 224), mode='bilinear', align_corners=False)

        model = get_model()
        with torch.no_grad():
            outputs = model(input_tensor)
            
        # Class names
        pathologies = model.pathologies
        results = zip(pathologies, outputs[0].detach().numpy())
        
        # Filter and sort
        findings = sorted(results, key=lambda x: x[1], reverse=True)
        
        report = "### AI Analysis Report (DenseNet121)\n"
        report += "**Note**: This is an automated analysis and NOT a medical diagnosis.\n\n"
        
        found_something = False
        for p, prob in findings:
            if prob > 0.5: # User-friendly threshold
                report += f"- **{p}**: {prob:.1%} (High Confidence) ⚠️\n"
                found_something = True
            elif prob > 0.2:
                report += f"- {p}: {prob:.1%}\n"
                
        if not found_something:
            report += "No significant pathologies detected above the confidence threshold.\n"
                
        return report

    except FileNotFoundError:
        return f"Error: Image file not found at {image_path}"
    except Exception as e:
        return f"Error analyzing X-ray: {str(e)}"

if __name__ == "__main__":
    mcp.run()
