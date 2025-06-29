
require 'mini_magick'

# Define watermark text and settings
WATERMARK_TEXT = "Nitin Nataraj"
FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf" # Common font path on Linux, adjust if needed
FONT_SIZE = 30
FONT_COLOR = "black"
GRAVITY = "SouthEast" # Bottom right corner
MARGIN = 20 # Pixels from the edge

# Directory containing images
IMAGES_DIR = File.expand_path("../images", __FILE__)
THUMBS_DIR = File.expand_path("../images/thumbs", __FILE__)

# Ensure thumbnail directory exists
FileUtils.mkdir_p(THUMBS_DIR) unless File.directory?(THUMBS_DIR)

# Function to apply watermark
def apply_watermark(image_path)
  begin
    image = MiniMagick::Image.open(image_path)

    image.combine_options do |c|
      c.font FONT_PATH if File.exist?(FONT_PATH)
      c.pointsize FONT_SIZE
      c.fill FONT_COLOR
      c.stroke "white" # Add a white stroke
      c.strokewidth 1 # Stroke width
      c.gravity GRAVITY
      c.draw "text #{MARGIN},#{MARGIN} '#{WATERMARK_TEXT}'"
    end

    image.write image_path
    puts "Watermarked: #{image_path}"

    # Generate thumbnail
    thumb_path = File.join(THUMBS_DIR, File.basename(image_path))
    image.resize "600x400^"
    image.gravity "center"
    image.crop "600x400+0+0"
    image.write thumb_path
    puts "Generated thumbnail: #{thumb_path}"
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

puts "Watermarking process complete."
