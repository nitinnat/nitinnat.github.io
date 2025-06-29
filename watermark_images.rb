
require 'mini_magick'

# Define watermark text and settings
WATERMARK_TEXT = "Nitin Nataraj"
FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf" # Common font path on Linux, adjust if needed
FONT_SIZE = 24
FONT_COLOR = "white"
GRAVITY = "SouthEast" # Bottom right corner
MARGIN = 20 # Pixels from the edge

# Directory containing images
IMAGES_DIR = File.expand_path("../images", __FILE__)
THUMBS_DIR = File.expand_path("../images/thumbs", __FILE__)
EXPERIENCE_IMAGES_DIR = File.expand_path("../experience_images", __FILE__)
EXPERIENCE_THUMBS_DIR = File.expand_path("../experience_images/thumbs", __FILE__)

# Ensure thumbnail directory exists
FileUtils.mkdir_p(THUMBS_DIR) unless File.directory?(THUMBS_DIR)
FileUtils.mkdir_p(EXPERIENCE_THUMBS_DIR) unless File.directory?(EXPERIENCE_THUMBS_DIR)

# Function to apply watermark
def apply_watermark(image_path)
  begin
    image = MiniMagick::Image.open(image_path)

    # Check if the image is already watermarked (simple check, can be improved)
    # This is a basic check and might not be foolproof.
    # A more robust solution would involve storing metadata or a separate list of watermarked images.
    # For now, we'll assume if the file size hasn't changed significantly, it might be watermarked.
    # Or, we can just re-watermark every time, which is simpler but less efficient.
    # For this script, we'll re-watermark every time to ensure consistency.

    image.combine_options do |c|
      c.font FONT_PATH if File.exist?(FONT_PATH)
      c.pointsize FONT_SIZE
      c.fill FONT_COLOR
      c.gravity GRAVITY
      c.draw "text #{MARGIN},#{MARGIN} '#{WATERMARK_TEXT}'"
    end

    image.write image_path
    puts "Watermarked: #{image_path}"
  rescue MiniMagick::Error => e
    puts "Error processing #{image_path}: #{e.message}"
  rescue Errno::ENOENT => e
    puts "Error: Font file not found at #{FONT_PATH}. Please update FONT_PATH in watermark_images.rb. #{e.message}"
  rescue Exception => e
    puts "An unexpected error occurred for #{image_path}: #{e.message}"
  end
end

# Iterate through image directories and apply watermark
Dir.glob(File.join(IMAGES_DIR, "**", "*.{jpg,jpeg,png,gif,JPG,JPEG,PNG,GIF}")).each do |file_path|
  # Skip if it's a directory
  next if File.directory?(file_path)
  apply_watermark(file_path)
end

# Iterate through experience image directories and apply watermark
Dir.glob(File.join(EXPERIENCE_IMAGES_DIR, "*.{png,jpg,jpeg,gif,PNG,JPG,JPEG,GIF}")).each do |file_path|
  # Skip if it's a directory
  next if File.directory?(file_path)
  apply_watermark(file_path)
end

puts "Watermarking process complete."
