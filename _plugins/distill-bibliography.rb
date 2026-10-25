require 'jekyll/scholar'
require 'nokogiri'

module Jekyll
  # Render the same cited works as Distill, using the existing CSL formatter.
  # Distill replaces this fallback list when its interactive citations load.
  class DistillBibliographyTag < Scholar::BibliographyTag
    def initialize(tag_name, _arguments, tokens)
      super(tag_name,
            '--file ../assets/bibliography/{{page.bibliography}} --template blog-reference --group_by none',
            tokens)
    end

    def render(context)
      content = Nokogiri::HTML.fragment(context['page']['content'].to_s)
      @citation_keys = content.css('d-cite[key]').flat_map do |citation|
        citation['key'].split(',').map(&:strip)
      end.uniq
      return '' if @citation_keys.empty?

      list = Nokogiri::HTML.fragment(super(context))
      list.at_css('ol')['class'] = 'references'
      list.at_css('ol')['id'] = 'references-list'
      %(<h3 id="references">References</h3>\n#{list.to_html})
    end

    def cited_entries
      by_key = entries.each_with_object({}) { |entry, result| result[entry.key] = entry }
      @citation_keys.filter_map { |key| by_key[key] }
    end
  end
end

Liquid::Template.register_tag('distill_bibliography', Jekyll::DistillBibliographyTag)
